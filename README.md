# 🏈 Gridiron Guru

Gridiron Guru is a full-stack NFL pick'em web app where users create accounts, make weekly game picks, and compete on a leaderboard.

Built with a modern monorepo structure using:

- **UI**: Next.js (React), TailwindCSS, Clerk Auth
- **API**: FastAPI, PostgreSQL, SQLAlchemy, Prisma
- **Deployment**: Vercel (frontend), Railway (backend + DB)

---

## 📸 Screenshots

### 📱 Home Page

![Gridiron Guru Home](/ui/public/raw1.png)

### 🏈 Weekly Picks Page

![Gridiron Guru Picks](/ui/public/raw.png)

---

## 🗂️ Project Structure

```
gridiron-guru/
├── ui/ # Next.js frontend
├── api/ # FastAPI backend
├── shared/ # Shared types/utils
├── prisma/ # Prisma schema and seed
└── README.md # You are here
```

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/gridiron-guru.git
cd gridiron-guru
```

## UI

```
cd ui
npm install
cp .env.local.example .env.local  # Add your Clerk keys
npm run dev
```

Runs on: http://localhost:3000

## API

```
cd ../api
poetry install
cp .env.example .env
# Add your DATABASE_URL
poetry run uvicorn app.main:app --reload
```

Runs on: http://localhost:8000

## Database

```
cd ..
npx prisma migrate dev --schema=./prisma/schema.prisma
npx prisma generate
```

# 📦 Deployment

Vercel → Deploy ui/ (Next.js app)

Railway → Deploy api/, attach PostgreSQL

Add appropriate environment variables in each service’s dashboard

# ✅ Features

NFL week-by-week pick selection

Auth via Clerk (signup, login)

User profile with win/loss record

Leaderboard based on correct picks
