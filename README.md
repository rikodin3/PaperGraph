# PaperGraph

PaperGraph is a full-stack application for discovering and visualizing relationships between academic research papers. It constructs a citation graph from the Semantic Scholar dataset, trains Node2Vec embeddings on the graph structure, and exposes the results through an interactive web interface where users can explore paper neighborhoods, find structurally similar papers, and inspect metadata --- all rendered as a force-directed graph.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Data Pipeline](#data-pipeline)
- [Node2Vec Training](#node2vec-training)
- [Backend API](#backend-api)
- [Frontend](#frontend)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)

---

## Overview

The core idea is to represent academic papers as nodes in a graph, with directed edges representing citation relationships (paper A cites paper B). Once this citation graph is built, the system applies Node2Vec --- a graph embedding algorithm --- to learn dense vector representations of each paper based on its structural position in the citation network. These embeddings are then used to compute cosine similarity between papers, enabling a "find similar papers" feature that goes beyond simple keyword matching.

The pipeline works in three stages:

1. **Data ingestion and graph construction** -- Download paper and citation data from the Semantic Scholar Academic Graph API, filter to Mathematics and Computer Science papers, and build a directed citation graph.
2. **Embedding training** -- Train a Node2Vec model on the citation graph to produce 64-dimensional embeddings for each paper node.
3. **Serving and visualization** -- Load the graph into a Neo4j database, serve it through a FastAPI backend, and render it in a browser using Cytoscape.js with a force-directed layout.

---

## Architecture

```
Semantic Scholar API
        |
        v
datasets_and_paper.ipynb   (ETL: download, filter, build edgelist)
        |
        v
  graph.edgelist + metadata.json
        |
        +-------> train_node2vec.ipynb   (Node2Vec training -> embeddings.txt)
        |
        +-------> build_graph.py         (batch load into Neo4j)
        |
        v
      Neo4j
        |
        v
  backend/ (FastAPI)
        |
        v
  frontend/ (Cytoscape.js)
```

---

## Data Pipeline

The notebook `datasets_and_paper.ipynb` handles the entire ETL process:

1. **Authentication** -- Connects to the Semantic Scholar Datasets API using an API key passed via environment variable or interactive prompt.
2. **Downloading paper metadata** -- Downloads compressed JSONL chunks of the full Semantic Scholar paper corpus (configurable number of chunks, typically 10).
3. **Filtering by field** -- Parses each paper record and retains only those belonging to the **Mathematics** or **Computer Science** fields of study. The filtered metadata (title, year, abstract, citation count, reference count, fields) is stored in a dictionary keyed by corpus ID.
4. **Downloading citation data** -- Downloads compressed JSONL chunks of the citation dataset (typically 10-15 chunks).
5. **Building the filtered edgelist** -- Iterates through citation records. An edge `(src, dst)` is written to `graph.edgelist` only if both the citing and cited paper IDs exist in the filtered paper set.
6. **Graph construction** -- Loads the edgelist into a NetworkX `DiGraph`, removes isolated nodes, and serializes the result as both a pickle file (`graph_filtered.pkl`) and an edgelist file (`graph_filtered.edgelist`). Metadata is exported as `metadata.json`.
7. **Neo4j upload** -- Batch uploads paper nodes (with metadata fields) and citation edges into a Neo4j graph database using Cypher `UNWIND` + `MERGE` queries for idempotent, high-throughput ingestion.

Typical dataset sizes observed during development:

- Filtered papers (Math/CS): ~1.2 million
- Final graph after strict filtering: ~230,000 nodes, ~151,000 edges

---

## Node2Vec Training

The notebook `train_node2vec.ipynb` trains graph embeddings:

1. **Graph loading** -- Reads `graph.edgelist` into an undirected NetworkX graph (Node2Vec operates on undirected graphs).
2. **Random walk generation** -- For each node, generates 10 random walks of length 15. Walks are generated manually with a progress bar rather than using the library's built-in walker, allowing better visibility into training progress on large graphs.
3. **Word2Vec training** -- Treats each random walk as a "sentence" and trains a Skip-gram Word2Vec model (via Gensim) with 64-dimensional vectors and a window size of 10.
4. **Embedding export** -- Saves the trained embeddings to `embeddings.txt` in Word2Vec format.
5. **Similarity queries** -- Provides a `query()` function that uses `model.wv.most_similar()` to find the top-K structurally similar papers to any given paper ID, with title lookup from metadata.

### Hyperparameters

| Parameter      | Value |
|----------------|-------|
| Dimensions     | 64    |
| Walk length    | 15    |
| Walks per node | 10    |
| p (return)     | 1.0   |
| q (in-out)     | 1.0   |
| Window size    | 10    |
| Workers        | 2     |

---

## Backend API

The backend is a FastAPI application located in `backend/` that interfaces with a Neo4j graph database.

### Configuration

Environment variables (loaded from `.env` via `python-dotenv`):

| Variable         | Default                  | Description                |
|------------------|--------------------------|----------------------------|
| `NEO4J_URI`      | `bolt://localhost:7687`  | Neo4j Bolt connection URI  |
| `NEO4J_USER`     | `neo4j`                  | Neo4j username             |
| `NEO4J_PASSWORD`  | `neo4j`                  | Neo4j password             |
| `NEO4J_DATABASE` | `neo4j`                  | Neo4j database name        |
| `CORS_ORIGINS`   | `*`                      | Comma-separated CORS origins |

### Endpoints

| Method | Path                              | Description                                                                 |
|--------|-----------------------------------|-----------------------------------------------------------------------------|
| GET    | `/health`                         | Returns database connectivity status.                                       |
| GET    | `/papers/search?q=...&limit=20`   | Full-text search on paper titles, ordered by citation count.                |
| GET    | `/papers/{paper_id}`              | Returns full metadata for a single paper, including incoming/outgoing edge counts. |
| GET    | `/graph/related/{paper_id}?k=30`  | Finds papers sharing the most cited references with the given paper (co-citation overlap). |
| GET    | `/graph/neighborhood/{paper_id}`  | Returns the 1-hop or 2-hop citation neighborhood as a node/edge graph suitable for visualization. |

### Running the backend

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API docs are available at `http://localhost:8000/docs`.

---

## Frontend

The frontend is a static single-page application in `frontend/` consisting of three files:

- `index.html` -- The application shell with a landing page, search form, graph view with left/right panels, and search history.
- `app.js` -- All client-side logic including API calls, Cytoscape.js graph rendering, caching, and navigation.
- `styles.css` -- Styling using CSS variables, responsive grid layouts, and subtle animations.

### Key features

- **Landing page** with a search bar that queries the backend for papers by title.
- **Graph visualization** using Cytoscape.js with a COSE (Compound Spring Embedder) force-directed layout. Nodes are sized by citation count (log-scaled + rank-blended) and colored by publication year.
- **Related works panel** showing papers with the highest structural similarity (embedding-based cosine similarity with fallback to co-citation overlap).
- **Paper details panel** displaying title, authors, abstract, citation statistics, and external links.
- **Search history** persisted in `localStorage` with automatic pruning to the most recent 12 entries.
- **Graph caching** in `localStorage` to avoid redundant API calls when revisiting previously viewed papers (up to 18 cached entries with LRU eviction).
- **Responsive design** with breakpoints at 1100px and 760px for tablet and mobile layouts.

### Typography

- **Fraunces** (serif) for brand/heading text.
- **Space Grotesk** (sans-serif) for body text.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Neo4j 5.x (Community or Enterprise)
- A Semantic Scholar API key (for data ingestion)

### Step 1: Data Ingestion

1. Obtain a Semantic Scholar API key from [semanticscholar.org](https://www.semanticscholar.org/product/api).
2. Open `datasets_and_paper.ipynb` in Jupyter or Google Colab.
3. Enter your API key when prompted and run all cells. This will download paper and citation data, filter to Math/CS, build the edgelist, and upload to Neo4j.

### Step 2: Train Embeddings

1. Open `train_node2vec.ipynb` in Jupyter or Google Colab.
2. Upload `graph.edgelist` and `metadata.json` (produced in Step 1) to the notebook environment.
3. Run all cells. This will train Node2Vec embeddings and save them to `embeddings.txt`.

### Step 3: Load Graph into Neo4j

If you did not upload to Neo4j via the notebook, you can use the standalone script:

```bash
python build_graph.py
```

This loads `graph_filtered.pkl` and `metadata.pkl` into Neo4j using batched Cypher queries.

### Step 4: Start the Backend

```bash
# Create and configure .env file
cp .env.example .env  # then edit with your Neo4j credentials

# Install Python dependencies
pip install fastapi uvicorn neo4j python-dotenv pydantic

# Run the server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Serve the Frontend

The frontend consists of static files. Serve them with any static file server. The FastAPI backend can also be configured to serve them:

```bash
# Simple option: Python built-in server
cd frontend
python -m http.server 3000
```

Then open `http://localhost:3000` in your browser.

---

## Project Structure

```
PaperGraph/
|-- README.md                       # This file
|-- datasets_and_paper.ipynb        # ETL notebook: download, filter, build graph
|-- train_node2vec.ipynb            # Node2Vec training notebook
|-- build_graph.py                  # Standalone Neo4j graph loader
|-- backend/
|   |-- __init__.py
|   |-- config.py                   # Environment-based settings (Neo4j, CORS)
|   |-- db.py                       # Neo4j driver wrapper
|   |-- main.py                     # FastAPI application and route handlers
|   |-- schemas.py                  # Pydantic models (PaperNode, GraphEdge, etc.)
|   |-- README.md                   # Backend-specific documentation
|-- frontend/
|   |-- index.html                  # Application shell and layout
|   |-- app.js                      # Client logic, Cytoscape.js graph rendering
|   |-- styles.css                  # Styling with CSS variables and responsive design
```

### Generated artifacts (not committed)

| File                       | Description                                      |
|----------------------------|--------------------------------------------------|
| `data/`                    | Raw downloaded JSONL.gz chunks                   |
| `graph.edgelist`           | Full filtered edgelist (all Math/CS citations)   |
| `graph_filtered.edgelist`  | NetworkX-exported filtered edgelist              |
| `graph_filtered.pkl`       | Pickled NetworkX DiGraph                         |
| `metadata.json`            | Paper metadata dictionary (corpus ID to fields)  |
| `metadata.pkl`             | Pickled metadata dictionary                      |
| `embeddings.txt`           | Node2Vec embeddings in Word2Vec format           |

---

## Dependencies

### Python (Backend and Notebooks)

| Package          | Purpose                                    |
|------------------|--------------------------------------------|
| `fastapi`        | Web framework for the API                  |
| `uvicorn`        | ASGI server                                |
| `neo4j`          | Neo4j Python driver                        |
| `pydantic`       | Data validation and serialization          |
| `python-dotenv`  | Environment variable management            |
| `networkx`       | Graph data structure and algorithms        |
| `node2vec`       | Node2Vec walk generation (optional)        |
| `gensim`         | Word2Vec model training                    |
| `requests`       | HTTP client for Semantic Scholar API       |
| `tqdm`           | Progress bars                              |

### Frontend (CDN)

| Library          | Purpose                                    |
|------------------|--------------------------------------------|
| `cytoscape.js`   | Graph visualization and layout             |
| Google Fonts     | Fraunces and Space Grotesk typefaces        |