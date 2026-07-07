# Campus Skill Exchange

This repository contains:
- **Frontend (React + Vite)**: `src/`
- **Backend (Express + Mongoose, TypeScript)**: `server/`

## Requirements
- Node.js 18+
- MongoDB running (or set a connection string)

## Backend
### Run
```bash
npm run server
```

### Environment variables
Create a `.env` file (at repo root) with:
- `MONGODB_URI` (optional, default: `mongodb://127.0.0.1:27017/campus-skill`)
- `JWT_SECRET` (optional, default: `your-secret-key-change-in-production`)
- `PORT` (optional, default: `5000`)

## Frontend
### Run (dev)
```bash
npm run dev
```

## Notes on legacy backend
There is an older Express/Mongoose JS backend under `campus-skill-backend/`.
It is **not** wired into the main app and is kept only for reference.

