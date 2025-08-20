import os
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager

db_pool = None

def get_db_url() -> str:
    """Constructs the database URL from environment variables."""
    host = os.getenv("DB_HOST", "localhost")
    
    return f"dbname='{os.getenv('DB_NAME', 'poker')}' user='{os.getenv('DB_USER', 'poker')}' password='{os.getenv('DB_PASSWORD', 'poker')}' host='{host}' port='{os.getenv('DB_PORT', '5432')}'"

def startup_db_client():
    """Initializes the database connection pool."""
    global db_pool
    db_url = get_db_url()
    print(f"Initializing database connection pool for host: {os.getenv('DB_HOST', 'localhost')}...")
    db_pool = SimpleConnectionPool(minconn=1, maxconn=10, dsn=db_url)

def shutdown_db_client():
    """Closes all connections in the pool."""
    global db_pool
    if db_pool:
        print("Closing database connection pool...")
        db_pool.closeall()

@contextmanager
def get_db_connection():
    """Gets a connection from the pool."""
    if not db_pool:
        raise RuntimeError("Database pool is not initialized.")
    
    conn = db_pool.getconn()
    try:
        yield conn
    finally:
        db_pool.putconn(conn)

def get_db():
    """FastAPI dependency to get a database connection."""
    with get_db_connection() as conn:
        yield conn
