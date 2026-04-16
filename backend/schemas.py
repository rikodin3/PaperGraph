from pydantic import BaseModel


class PaperNode(BaseModel):
    id: int
    title: str | None = None
    year: int | None = None


class GraphEdge(BaseModel):
    source: int
    target: int


class GraphResponse(BaseModel):
    nodes: list[PaperNode]
    edges: list[GraphEdge]


class RelatedPaper(BaseModel):
    id: int
    title: str | None = None
    year: int | None = None
    overlap: int
