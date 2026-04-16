from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import neo4j_client
from .schemas import GraphEdge, GraphResponse, PaperNode, RelatedPaper


app = FastAPI(title="Connected Papers Backend", version="0.1.0")

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
def shutdown_event() -> None:
    neo4j_client.close()


@app.get("/health")
def health() -> dict:
    ok = neo4j_client.run_scalar("RETURN 1 AS ok", key="ok")
    return {"status": "ok" if ok == 1 else "degraded"}


@app.get("/papers/search")
def search_papers(q: str = Query(..., min_length=2), limit: int = Query(20, ge=1, le=100)) -> list[PaperNode]:
    query = """
    MATCH (p:Paper)
    WHERE toLower(coalesce(p.title, "")) CONTAINS toLower($q)
    RETURN p.id AS id, p.title AS title, p.year AS year
    ORDER BY coalesce(p.citationCount, 0) DESC, coalesce(p.year, 0) DESC
    LIMIT $limit
    """
    rows = neo4j_client.run_query(query, q=q, limit=limit)
    return [PaperNode(**row) for row in rows]


@app.get("/papers/{paper_id}")
def get_paper(paper_id: int) -> dict:
    paper_query = """
    MATCH (p:Paper {id: $paper_id})
    RETURN p.id AS id, p.title AS title, p.year AS year,
           p.abstract AS abstract, p.citationCount AS citationCount,
           p.referenceCount AS referenceCount
    """
    paper = neo4j_client.run_query(paper_query, paper_id=paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    stats_query = """
    MATCH (p:Paper {id: $paper_id})
    OPTIONAL MATCH (p)-[:CITES]->(r:Paper)
    WITH p, count(DISTINCT r) AS outgoing
    OPTIONAL MATCH (c:Paper)-[:CITES]->(p)
    RETURN outgoing, count(DISTINCT c) AS incoming
    """
    stats = neo4j_client.run_query(stats_query, paper_id=paper_id)[0]

    return {**paper[0], **stats}


@app.get("/graph/related/{paper_id}")
def related_papers(paper_id: int, k: int = Query(30, ge=1, le=200)) -> list[RelatedPaper]:
    query = """
    MATCH (p:Paper {id: $paper_id})-[:CITES]->(ref:Paper)<-[:CITES]-(cand:Paper)
    WHERE cand.id <> $paper_id
    WITH cand, count(DISTINCT ref) AS overlap
    RETURN cand.id AS id, cand.title AS title, cand.year AS year, overlap
    ORDER BY overlap DESC, coalesce(cand.citationCount, 0) DESC
    LIMIT $k
    """
    rows = neo4j_client.run_query(query, paper_id=paper_id, k=k)
    return [RelatedPaper(**row) for row in rows]


@app.get("/graph/neighborhood/{paper_id}")
def neighborhood_graph(
    paper_id: int,
    depth: int = Query(1, ge=1, le=2),
    max_nodes: int = Query(300, ge=10, le=2000),
    max_edges: int = Query(4000, ge=10, le=20000),
) -> GraphResponse:
    rel_pattern = "*1..1" if depth == 1 else "*1..2"
    nodes_query = f"""
    MATCH (root:Paper {{id: $paper_id}})
    OPTIONAL MATCH (root)-[:CITES{rel_pattern}]-(n:Paper)
    WITH root, collect(DISTINCT n) AS near
    WITH [root] + near AS all_nodes
    UNWIND all_nodes AS n
    RETURN DISTINCT n.id AS id, n.title AS title, n.year AS year
    LIMIT $max_nodes
    """

    rows = neo4j_client.run_query(nodes_query, paper_id=paper_id, max_nodes=max_nodes)
    if not rows:
        raise HTTPException(status_code=404, detail="Paper not found or no neighborhood")

    nodes = [PaperNode(**row) for row in rows]
    ids = [node.id for node in nodes]

    edges_query = """
    UNWIND $ids AS src
    MATCH (a:Paper {id: src})-[:CITES]->(b:Paper)
    WHERE b.id IN $ids
    RETURN DISTINCT a.id AS source, b.id AS target
    LIMIT $max_edges
    """
    edge_rows = neo4j_client.run_query(edges_query, ids=ids, max_edges=max_edges)
    edges = [GraphEdge(**row) for row in edge_rows]

    return GraphResponse(nodes=nodes, edges=edges)
