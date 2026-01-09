from __future__ import annotations

import logging
import os

import psycopg
from psycopg_pool import AsyncConnectionPool


logger = logging.getLogger(__name__)

DB_HOST = os.environ.get("DEVKIT_DB_HOST", "postgres")
DB_PORT = int(os.environ.get("DEVKIT_DB_PORT", "5432"))
DB_NAME = os.environ.get("DEVKIT_DB_NAME", os.environ.get("DEVKIT_DB", "hla_compass"))
DB_USER = os.environ.get("DEVKIT_DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DEVKIT_DB_PASSWORD", "postgres")

conninfo = (
    f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} "
    f"password={DB_PASSWORD} connect_timeout=2"
)

pool: AsyncConnectionPool | None = None


async def init_pool() -> None:
    global pool
    pool = AsyncConnectionPool(conninfo=conninfo, min_size=2, max_size=10, open=False)
    try:
        await pool.open()
    except Exception as exc:
        logger.warning("Postgres pool init failed", exc_info=exc)


async def close_pool() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None


async def check_postgres() -> dict:
    if not pool:
        return {"status": "error", "message": "Pool not initialized"}
    if pool.closed:
        try:
            await pool.open()
        except Exception as exc:
            logger.warning("Postgres pool open failed", exc_info=exc)
            return {"status": "error", "message": "Database connection failed"}
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
        return {"status": "ok"}
    except psycopg.OperationalError as exc:
        logger.warning("Postgres connection failed", exc_info=exc)
        return {"status": "error", "message": "Database connection failed"}
    except psycopg.InterfaceError as exc:
        logger.warning("Postgres interface error", exc_info=exc)
        return {"status": "error", "message": "Database interface error"}
    except Exception as exc:
        logger.exception("Postgres unexpected error", exc_info=exc)
        return {"status": "error", "message": "Database error"}
