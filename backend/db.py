from neo4j import GraphDatabase

from .config import settings


class Neo4jClient:
    def __init__(self) -> None:
        self._driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )

    def close(self) -> None:
        self._driver.close()

    def run_query(self, query: str, **params):
        with self._driver.session(database=settings.neo4j_database) as session:
            result = session.run(query, **params)
            return [record.data() for record in result]

    def run_scalar(self, query: str, key: str, **params):
        with self._driver.session(database=settings.neo4j_database) as session:
            record = session.run(query, **params).single()
            if not record:
                return None
            return record.get(key)


neo4j_client = Neo4jClient()
