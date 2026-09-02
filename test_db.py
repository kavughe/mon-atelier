import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL")

print("Test de connexion PostgreSQL...")

try:
    conn = psycopg2.connect(
        url,
        connect_timeout=10
    )

    print("Connexion PostgreSQL réussie !")

    cursor = conn.cursor()
    cursor.execute("SELECT version();")

    print(cursor.fetchone()[0])

    cursor.close()
    conn.close()

except Exception as e:
    print("ERREUR :")
    print(e)