# Hustle Dashboard

A MERN stack dashboard with a green color scheme. The dashboard displays filterable cards with an organization header.

## Project Structure

```
ZuZo/
├── backend/     # Spring Boot + PostgreSQL API
├── frontend/    # React (Vite) dashboard
└── README.md
```

## Prerequisites

- Node.js 18+
- Java 17+
- PostgreSQL (local)

## Setup

### 1. Backend Setup (Spring Boot + PostgreSQL)

Make sure PostgreSQL is running and you have a database named `hustle`
(or update `backend/src/main/resources/application.properties`).

```bash
cd backend
mvn spring-boot:run
```

To seed sample cards (first time or when resetting data):

```bash
curl -X POST http://localhost:5000/api/seed
```

### 2. Frontend Setup (React + Vite)

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

## Tech Stack

- **PostgreSQL** – Database
- **Spring Boot** – API server
- **React** – Frontend UI
- **Node.js** – Frontend tooling/runtime

## Features

- ZuZo organization header
- Filter buttons (by category)
- Sort options (Default, A–Z, Z–A, By Letter)
- Card grid with green-themed design
