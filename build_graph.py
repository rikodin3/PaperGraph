import networkx as nx
from neo4j import GraphDatabase
import pickle
# =========================
# CONFIG
# =========================
URI = "neo4j://127.0.0.1:7687"
USER = "neo4j"
PASSWORD = "juliuscaesar69"

BATCH_SIZE_NODES = 5000
BATCH_SIZE_EDGES = 10000


# =========================
# CONNECT
# =========================
driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))


# =========================
# CREATE CONSTRAINT
# =========================
def create_constraint():
    with driver.session() as session:
        session.run("""
        CREATE CONSTRAINT paper_id IF NOT EXISTS
        FOR (p:Paper) REQUIRE p.id IS UNIQUE
        """)
    print("Constraint created (or already exists)")


# =========================
# LOAD NODES
# =========================
def insert_nodes(tx, batch):
    query = """
    UNWIND $nodes AS node
    MERGE (p:Paper {id: node.id})
    SET paper.title = p.title,
        paper.year = p.year,
        paper.fields = p.fields,
        paper.abstract = p.abstract,
        paper.citationCount = p.citationCount,
        paper.referenceCount = p.referenceCount,
        paper.embedding = p.embedding
            
    """
    tx.run(query, nodes=batch)


def load_nodes(G, metadata):
    print("Loading nodes...")

    nodes_data = []
    for node in G.nodes():
        if node in metadata:
            d = metadata[node]
            nodes_data.append({
                "id": node,
                "title": d.get("title"),
                "year": d.get("year"),
                "fields": d.get("fields", []),
                "abstract": d.get("abstract"),
                "citationCount": d.get("citationCount"),
                "referenceCount": d.get("referenceCount"),
            })
        else:
            # neighbor node (no metadata)
            nodes_data.append({
                "id": node,
                "title": None,
                "year": None,
                "fields": []
            })

    with driver.session() as session:
        for i in range(0, len(nodes_data), BATCH_SIZE_NODES):
            batch = nodes_data[i:i+BATCH_SIZE_NODES]
            session.execute_write(insert_nodes, batch)
            print(f"Inserted nodes: {i + len(batch)} / {len(nodes_data)}")


# =========================
# LOAD EDGES
# =========================
def insert_edges(tx, batch):
    query = """
    UNWIND $edges AS edge
    MATCH (a:Paper {id: edge[0]})
    MATCH (b:Paper {id: edge[1]})
    MERGE (a)-[:CITES]->(b)
    """
    tx.run(query, edges=batch)


def load_edges(G):
    print("Loading edges...")

    edges = list(G.edges())

    with driver.session() as session:
        for i in range(0, len(edges), BATCH_SIZE_EDGES):
            batch = edges[i:i+BATCH_SIZE_EDGES]
            session.execute_write(insert_edges, batch)
            print(f"Inserted edges: {i + len(batch)} / {len(edges)}")


# =========================
# MAIN
# =========================
def main(G, metadata):
    print("Starting Neo4j load...")

    create_constraint()
    load_nodes(G, metadata)
    load_edges(G)

    print("Done!")


# =========================
# ENTRY POINT
# =========================
if __name__ == "__main__":

    with open('graph_filtered.pkl', 'rb') as file:
        G = pickle.load(file)
    with open('metadata.pkl', 'rb') as file:
        metadata = pickle.load(file)

    main(G, metadata)

    driver.close()

