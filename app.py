import os
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, render_template

try:
    import psycopg
except ImportError:
    psycopg = None

BASE_DIR = Path(__file__).resolve().parent
SQLITE_PATH = BASE_DIR / "encuestas.db"
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

app = Flask(__name__)


def using_postgres():
    return bool(DATABASE_URL) and psycopg is not None


def get_connection():
    if using_postgres():
        url = DATABASE_URL
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        return psycopg.connect(url)
    return sqlite3.connect(SQLITE_PATH)


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS encuestas (
                id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                fecha TEXT NOT NULL,
                respuestas TEXT NOT NULL
            )
        """ if using_postgres() else """
            CREATE TABLE IF NOT EXISTS encuestas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha TEXT NOT NULL,
                respuestas TEXT NOT NULL
            )
        """)
        conn.commit()


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/api/encuestas", methods=["POST"])
def guardar_encuesta():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict) or not datos:
        return jsonify(ok=False, mensaje="Los datos de la encuesta no son válidos."), 400

    respuestas = json.dumps(datos, ensure_ascii=False)
    with get_connection() as conn:
        if using_postgres():
            cursor = conn.execute(
                "INSERT INTO encuestas (fecha, respuestas) VALUES (%s, %s) RETURNING id",
                (now_iso(), respuestas),
            )
            encuesta_id = cursor.fetchone()[0]
        else:
            cursor = conn.execute(
                "INSERT INTO encuestas (fecha, respuestas) VALUES (?, ?)",
                (now_iso(), respuestas),
            )
            encuesta_id = cursor.lastrowid
        conn.commit()

    return jsonify(ok=True, mensaje="Encuesta guardada correctamente.", id=encuesta_id), 201


@app.route("/api/encuestas", methods=["GET"])
def listar_encuestas():
    # Se conserva este endpoint para consultar los registros desde el proyecto.
    with get_connection() as conn:
        if using_postgres():
            filas = conn.execute(
                "SELECT id, fecha, respuestas FROM encuestas ORDER BY id DESC"
            ).fetchall()
            resultado = [
                {"id": f[0], "fecha": f[1], "respuestas": json.loads(f[2])}
                for f in filas
            ]
        else:
            conn.row_factory = sqlite3.Row
            filas = conn.execute(
                "SELECT id, fecha, respuestas FROM encuestas ORDER BY id DESC"
            ).fetchall()
            resultado = [
                {"id": f["id"], "fecha": f["fecha"], "respuestas": json.loads(f["respuestas"])}
                for f in filas
            ]
    return jsonify(resultado)


# Render ejecuta Gunicorn y necesita que la base se inicialice al importar la app.
init_db()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
