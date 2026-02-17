# ServeSpot (MERN) – Run Client & Server Separately

This zip contains **two separate apps**:
- `client/` (React + Vite)
- `server/` (Node.js + Express + MongoDB)

---

## 1) Run Server (Terminal-1)

```bash
cd server
npm install
cp .env.example .env
# edit .env if needed
npm run dev
```

Server runs on: http://localhost:5000  
Health check: http://localhost:5000/api/health

---

## 2) Run Client (Terminal-2)

```bash
cd client
npm install
npm run dev
```

Client runs on: http://localhost:5173

---

## MongoDB
Use either:
- Local: `mongodb://127.0.0.1:27017/servespot`
- Atlas: paste your Atlas connection string in `server/.env`
