# Deployment Guide: Geo-Fenced QR Attendance System

This guide outlines the steps to deploy the system in a production-like environment.

## 1. Database Setup (MySQL)
1. Install MySQL Server.
2. Create a database: `CREATE DATABASE attendance_db;`.
3. Run the schema script: `mysql -u root -p attendance_db < backend/schema.sql`.

## 2. Backend Deployment (FastAPI)
1. **Environment Variables**: Create a `.env` file in the `backend/` directory:
   ```env
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_NAME=attendance_db
   SECRET_KEY=your_super_secret_jwt_key
   ```
2. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. **Run with Uvicorn**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   *For production, use a process manager like Gunicorn with Uvicorn workers.*

## 3. Frontend Deployment (React)
1. **Environment Variables**: Create a `.env` file in the `frontend/` directory (if using environment variables for API URL):
   ```env
   VITE_API_BASE=http://your-backend-ip:8000
   ```
2. **Build the Project**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
3. **Serve the Static Files**:
   Use Nginx or Vercel/Netlify to serve the contents of the `frontend/dist` folder.

## 4. Production Checklist
- [ ] **HTTPS**: Ensure the site is served over HTTPS. **Geolocation API requires a secure context (HTTPS) to work on most mobile browsers.**
- [ ] **CORS**: Update `allow_origins` in `backend/main.py` to only allow your frontend domain.
- [ ] **Secret Key**: Use a strong, unique `SECRET_KEY` for JWT.
- [ ] **Validation Radius**: Adjust the distance radius in `backend/main.py` (currently 100m) based on your campus size.

## 5. Local Quick Start
To test locally:
1. Start MySQL.
2. `cd backend && uvicorn main:app --host 0.0.0.0`
3. `cd frontend && npm run dev -- --host`
