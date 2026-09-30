# Encuesta sobre Áreas Verdes — versión para Render

## Publicar en Render

1. Subí esta carpeta a un repositorio de GitHub.
2. En Render elegí **New + > Web Service**.
3. Conectá el repositorio.
4. Usá estos valores:
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
5. Creá una base de datos PostgreSQL en Render.
6. En el Web Service, agregá la variable de entorno `DATABASE_URL` usando la URL interna de PostgreSQL.
7. Presioná **Deploy**.

La aplicación usa PostgreSQL cuando existe `DATABASE_URL`. Si se ejecuta localmente sin esa variable, usa `encuestas.db` de SQLite.

> Importante: el endpoint `/api/encuestas` permite consultar las respuestas. Si la encuesta se publica para cualquier persona, conviene proteger ese endpoint antes de compartir el enlace.
