from src.models.hand import Hand
from psycopg2.extensions import connection

class HandRepository:
    def __init__(self, conn: connection):
        self.conn = conn

    def create(self, hand: Hand) -> None:
        """Saves a hand to the database using its JSON representation."""
        with self.conn.cursor() as cur:
            cur.execute(
                """INSERT INTO hands (id, created_at, hand_data)
                   VALUES (%s, %s, %s)""",
                (hand.id, hand.timestamp, hand.to_json())
            )
        self.conn.commit()
    
    def get(self, hand_id: str) -> Hand | None:
        """Retrieves a single hand by its ID."""
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT hand_data FROM hands WHERE id = %s",
                (hand_id,)
            )
            row = cur.fetchone()
            return Hand.from_dict(row[0]) if row else None
    
    def list(self) -> list[Hand]:
        """Retrieves all hands, ordered by timestamp."""
        with self.conn.cursor() as cur:
            cur.execute("SELECT hand_data FROM hands ORDER BY created_at DESC")
            return [Hand.from_dict(row[0]) for row in cur.fetchall()]
