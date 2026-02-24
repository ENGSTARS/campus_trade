# camp_trade
Campus Trade Website For University


frontend/
├── public/               # Static assets (favicon, manifest.json)
├── src/
│   ├── assets/           # Images, SVG, CSS files
│   ├── components/       # Reusable UI elements (Navbar, Buttons)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page-level components (Home, Login, Dashboard)
│   ├── services/         # API calls (e.g., using Axios)
│   ├── store/            # State management (Redux or Context API)
│   ├── App.jsx           # Main routing and global providers
│   └── main.jsx          # Entry point
├── .env                  # Frontend variables (API_BASE_URL)
├── package.json          # Node dependencies
└── vite.config.js        # Vite configuration



backend/
├── manage.py
├── .env                  # Environment variables (DB_PASSWORD, SECRET_KEY)
├── requirements.txt      # Python dependencies
├── core/                 # Main Django project settings folder
│   ├── settings.py
│   ├── urls.py           # Main routing (pointing to your apps)
│   └── wsgi.py
└── api/                  # A dedicated app for your business logic
    ├── migrations/
    ├── models.py         # Database schema
    ├── serializers.py    # Converts Django models to JSON for React
    ├── views.py          # API endpoints (using DRF)
    └── urls.py           # API-specific routing
