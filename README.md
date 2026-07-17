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
(Or start both backend + frontend together with `npm run dev`.)

### Environment variables
Create a `.env` file (at repo root) with:
- `MONGODB_URI` (optional, default: `mongodb://localhost:27017/campus_skill`)
- `JWT_SECRET` (optional, default: `your-secret-key-change-in-production`)
- `PORT` (optional, default: `5000`)

## Frontend
### Run (dev)
```bash
npm run dev
```
This starts the backend (`npm run server`) and the Vite frontend together.
To run the frontend alone: `npm run client` (or `npm run build` + `npm run preview`).

## Notes on legacy backend
There is an older Express/Mongoose JS backend under `campus-skill-backend/`.
It is **not** wired into the main app and is kept only for reference.

