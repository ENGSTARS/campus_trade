# CampusTrade

CampusTrade is a university marketplace built with Django REST Framework and React + Vite.

## Local Development

Run the whole stack from the repo root:

```powershell
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`

Backend setup:

```powershell
cd server
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

Frontend setup:

```powershell
cd client
npm install
```

## Environment Files

The backend loads env values from either `server/.env` or the repo root `.env`.

Backend example values live in `server/.env.example`.
Frontend example values live in `.env.example`.

Important backend variables:

```text
DEBUG=True
SECRET_KEY=your_random_secret_key_here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
DB_NAME=campustrade_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
IMGBB_API_KEY=your_imgbb_api_key_here
```

## Django Settings Layout

Production-friendly settings now live under `server/core/settings/`:

```text
server/core/settings/
├── __init__.py
├── base.py
└── production.py
```

- `core.settings` loads the shared base settings for local development.
- `core.settings.production` applies production-only overrides.

## Production Deployment

Recommended Render environment variable:

```text
DJANGO_SETTINGS_MODULE=core.settings.production
```

Recommended backend build command:

```bash
pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
```

Recommended backend start command:

```bash
gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
```

Recommended production env values:

```text
DEBUG=False
SECRET_KEY=replace_me
ALLOWED_HOSTS=your-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
IMGBB_API_KEY=...
```

## Deployment Dependencies

Backend deployment dependencies are listed in `server/requirements.txt`, including:

- `gunicorn`
- `whitenoise`
- `python-dotenv`
- `psycopg2-binary`
