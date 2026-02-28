# ZuZo Dashboard

A MERN stack dashboard with a green color scheme. The dashboard displays filterable cards with an organization header.

## Project Structure

```
ZuZo/
├── backend/     # Node.js + Express + MongoDB API
├── frontend/    # React (Vite) dashboard
└── README.md
```

## Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)

## Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and update if needed:

```bash
copy .env.example .env
```

Start MongoDB locally, then run:

```bash
npm run dev
```

Seed sample cards (first time):

```bash
curl -X POST http://localhost:5000/api/seed
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## Running the App

### Start the Frontend (React dev server)

```bash
cd frontend
npm run dev
```

The app will be available at **http://localhost:3000**

The frontend proxies `/api` requests to the backend on port 5000, so ensure the backend is running for full functionality. Without the backend, the app will show mock data.

### Start the Backend (optional but recommended)

In a separate terminal:

```bash
cd backend
npm start
# or for development: npm run dev
```

## Tech Stack

- **MongoDB** – Database
- **Express** – API server
- **React** – Frontend UI
- **Node.js** – Backend runtime

## Features

- ZuZo organization header
- Filter buttons (by category)
- Sort options (Default, A–Z, Z–A, By Letter)
- Card grid with green-themed design
