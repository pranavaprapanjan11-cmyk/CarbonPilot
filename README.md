# EcoSphere AI - ESG Digital Twin Command Center

EcoSphere AI is a full-stack, enterprise-grade ESG (Environmental, Social, and Governance) management platform. It tracks carbon emissions, triggers operational simulations, and provides real-time gamified sustainability incentives.

This repository features:
1. **FastAPI Backend (`/backend`)**: High-performance REST APIs built with Python, SQLAlchemy, JWT Authentication, and PostgreSQL connection adapters (falling back to SQLite for local development).
2. **React Frontend (`/frontend`)**: Scaffolding initialized with Vite, styled with Tailwind CSS, displaying real-time responsive analytics via Chart.js, and incorporating fluid page movements with Framer Motion.

---

## Technical Stack & Architecture

### Backend:
- **FastAPI**: REST endpoints, JWT authorization, and Swagger documentation (`/docs`).
- **SQLAlchemy ORM**: Entity mapping for SQLite/PostgreSQL databases.
- **Pydantic**: Request/response serialization schemas.

### Frontend:
- **React (Vite)**: Component layout rendering.
- **Tailwind CSS**: Glassmorphism color palettes.
- **Framer Motion**: Smooth entry/exit toast state transitions.
- **Chart.js (react-chartjs-2)**: High-contrast data tracking.
- **Axios**: Dynamic endpoint requests with JWT headers auto-injection.

---

## Getting Started Locally

### 1. Run the Backend
Navigate to the `backend/` directory:
```bash
cd backend
```
Install dependencies:
```bash
pip install -r requirements.txt
```
Start the local server (listens on `http://localhost:8000`):
```bash
uvicorn main:app --reload
```
*Note: SQLite database `ecosphere.db` is initialized and pre-seeded automatically with baseline ESG data on the first boot.*

### 2. Run the Frontend
Navigate to the `frontend/` directory:
```bash
cd ../frontend
```
Install node dependencies:
```bash
npm install
```
Start the development server (runs on `http://localhost:5173`):
```bash
npm run dev
```

---

## 🔑 Hackathon Access Credentials
Log in immediately using these pre-seeded demo user credentials:
- **Email Address**: `admin@ecosphere.ai`
- **Password**: `adminpass`

---

## Production Deployment Guides

### Backend (Railway)
1. Log in to [Railway.app](https://railway.app/) and create a new project.
2. Select **Provision PostgreSQL** to add a managed database.
3. Deploy the backend from GitHub: point the build command to the `/backend` folder.
4. Set Environment Variables:
   - `DATABASE_URL`: Automatically linked to Railway's PostgreSQL variables.
   - `SECRET_KEY`: Set to any secure cryptographic string.

### Frontend (Netlify)
1. Log in to [Netlify.com](https://www.netlify.com/) and link your repository.
2. Set build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Add Environment Variable:
   - `VITE_API_URL`: Set this to your live Railway API backend URL (e.g., `https://ecosphere-backend.up.railway.app`).
