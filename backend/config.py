import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv(override=True)


@dataclass(frozen=True)
class Settings:
    neo4j_uri: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user: str = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "neo4j")
    neo4j_database: str = os.getenv("NEO4J_DATABASE", "neo4j")
    cors_origins: str = os.getenv("CORS_ORIGINS", "*")


settings = Settings()
