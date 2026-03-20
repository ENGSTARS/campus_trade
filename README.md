
# 🎓 CampusTrade Full-Stack

A dedicated marketplace for university students to trade safely. Built with **Django REST Framework** and **React (Vite)**.



## 🚀 Quick Start (Unified Development)

To run the entire stack with one command, ensure you have `concurrently` installed in your **root** directory, then run:

```powershell
npm run dev

```

* **client:** `http://localhost:5173` (Magenta logs)
* **server API:** `http://localhost:8000` (Blue logs)

---

## 🛠️ Setup & Installation

### 1. Root Configuration (`/package.json`)

Your root `package.json` manages the orchestration of both folders using `concurrently`.

```json
{
  "name": "camp-trade-root",
  "version": "1.0.0",
  "scripts": {
    "server": "python server/manage.py runserver",
    "client": "npm run dev --prefix client",
    "dev": "concurrently -n \"DJANGO,VITE\" -c \"blue,magenta\" \"npm run server\" \"npm run client\""
  },
  "devDependencies": {
    "concurrently": "^9.2.1"
  }
}

```

### 2. server Setup (`/server`)

```powershell
cd server
python -m venv venv
.\venv\Scripts\activate

# Install core dependencies
pip install -r requirements.txt
pip install Pillow django-cors-headers djangorestframework-simplejwt

# Database Sync
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

```

### 3. client Setup (`/client`)

```powershell
cd client
npm install
npm install lucide-react  # Required for password visibility icons

```

---

## 🔐 Environment Variables (`.env`)

### server (`/server/.env`)

Create a `.env` file in the `server/` folder:

```text
DEBUG=True
SECRET_KEY=your_random_secret_key
DB_NAME=campustrade_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
IMGBB_API_KEY=your_imgbb_api_key

```

### client (`/client/.env`)

Create a `.env` file in the `client/` folder:

```text
VITE_API_BASE_URL=http://localhost:8000/api

```

---

## 📁 Project Structure

```text
camp_trade/
├── client/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/      # Reusable UI (Navbar, Input, Buttons)
│   │   ├── pages/           # Login & Register (with Eye Toggle)
│   │   ├── services/        # Axios API instances
│   │   └── hooks/           # Custom Logic (useAuth, etc.)
├── server/                 # Django + DRF
│   ├── core/                # Settings & Main URL configurations
│   ├── api/                 # User Auth, Profiles, & Student Registry
│   └── listings/            # Products, Orders, Offers, & Reviews
└── package.json             # Root runner script

```

---

## 💡 Key Commands Reference

| Action | Command | Location |
| --- | --- | --- |
| **Run Both Apps** | `npm run dev` | Root |
| **Make Migrations** | `python manage.py makemigrations` | `/server` |
| **Apply Migrations** | `python manage.py migrate` | `/server` |
| **Create Superuser** | `python manage.py createsuperuser` | `/server` |
| **Install client Icons** | `npm install lucide-react` | `/client` |

---

## 🛠️ Feature Highlights

* **Unified Execution:** Single command development environment with color-coded logs (Blue for Django, Magenta for Vite).
* **Enhanced Security:** Show/Hide password toggle on Login and Registration forms for better UX.
* **Database Design:** Automated profile creation via Django Signals and Soft-Delete logic for Marketplace listings.
* **Campus Context:** Integrated `X-Campus` header filtering to show products relevant to specific university branches.

```
