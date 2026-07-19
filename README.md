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

## Notes
The backend (`server/`) and frontend (`src/`) are wired together via the Vite dev
proxy (`/api`, `/uploads` → `http://localhost:5000`). No separate legacy backend exists.

