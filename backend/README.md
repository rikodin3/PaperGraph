# Backend API (Neo4j + FastAPI)

This backend exposes graph endpoints for a Connected Papers-style frontend.

## 1) Environment Variables

Set these in your `.env` (project root):

- `NEO4J_URI=bolt://localhost:7687`
- `NEO4J_USER=neo4j`
- `NEO4J_PASSWORD=your_password`
- `NEO4J_DATABASE=neo4j`
- `CORS_ORIGINS=http://localhost:3000,http://localhost:5173`

## 2) Run

From project root:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open docs at:

- `http://localhost:8000/docs`

## 3) API Endpoints

- `GET /health`
- `GET /papers/search?q=attention&limit=20`
- `GET /papers/{paper_id}`
- `GET /graph/related/{paper_id}?k=30`
- `GET /graph/neighborhood/{paper_id}?depth=2&max_nodes=300&max_edges=4000`

## 4) Frontend Integration Shape

For force-directed visualization, call:

- `GET /graph/neighborhood/{paper_id}`

Response shape:

```json
{
  "nodes": [
    {"id": 1600523, "title": "Attention Is All You Need", "year": 2017}
  ],
  "edges": [
    {"source": 1600523, "target": 12345}
  ]
}
```

Use `GET /graph/related/{paper_id}` to populate the side panel with highly related papers (shared references), similar to Connected Papers.
