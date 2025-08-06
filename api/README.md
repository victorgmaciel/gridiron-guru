# Gridiron Guru API

This is the backend API for the Gridiron Guru football pick'em app, built with FastAPI and managed via Poetry.

---

## 🛠 Requirements

- Python 3.10+
- [Poetry](https://python-poetry.org/docs/#installation)
- PostgreSQL (optional for database features)

---

## 🚀 Getting Started

### 1. Clone the repo & enter the API folder

```bash
git clone https://github.com/your-username/gridiron-guru.git
cd gridiron-guru/api
```

### 2. Install dependencies

```bash
poetry install
```

### 3. Create your `.env` file

Create a `.env` file in the root of the `api/` folder:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/gridiron
```

### 4. Run the development server

```bash
poetry run uvicorn gridiron_guru_api.main:app --reload
```

### 5. Test the API

Visit:

- [http://localhost:8000](http://localhost:8000)
- [http://localhost:8000/docs](http://localhost:8000/docs) – Swagger UI

---

## 📁 Project Structure

```
api/
├── app/
│   ├── main.py         # Entry point for FastAPI
│   ├── routes.py       # API route definitions
│   ├── models.py       # (Optional) SQLAlchemy models
│   ├── database.py     # (Optional) DB connection
│   └── crud.py         # (Optional) Data access logic
├── .env                # Environment variables
├── pyproject.toml      # Poetry config
└── README.md
```

---

## 🧪 Useful Commands

- Run server:

  ```bash
  poetry run uvicorn app.main:app --reload
  ```

- Run Python shell:
  ```bash
  poetry run python
  ```

---

## 🔧 Common Development Commands

### 🚀 Start the app (build & run containers)

```bash
docker compose up --build -d
```

- Builds the Docker images and starts all services (API, DB, pgAdmin) in the background (`-d` = detached).

---

### 🛑 Stop the app and remove containers

```bash
docker compose down
```

- Stops the app and removes containers, but **keeps volumes** (database data is preserved).

To also **remove volumes** (reset DB):

```bash
docker compose down --volumes
```

---

### 🐚 Open a shell inside the API container

```bash
docker compose exec api bash
```

- Access the running container for migrations, seeding, or debugging.

---

### 🐘 Connect to Postgres (inside db container)

```bash
docker compose exec db bash
psql -U postgres -d gridiron_guru
```

Then you can run SQL commands:

```sql
\dt                 -- List all tables
SELECT * FROM users;  -- View table data
```

Exit with `\q`.

---

### 🗃️ Alembic Migrations (inside API container)

**Upgrade DB to latest schema:**

```bash
alembic upgrade head
```

**Create a new migration after editing models:**

```bash
alembic revision --autogenerate -m "create tables"
```

---

### 🌱 Seed the database (if implemented)

```bash
python gridiron_guru_api/seed.py
```

> This should be run inside the container or via Docker exec if a seed script exists.

---

### 📋 View container status

```bash
docker compose ps
```

---

### 🔍 View logs

```bash
docker compose logs api
docker compose logs db
```

---

### 🔄 Rebuild only the API container

```bash
docker compose up --build -d api
```

---

### 🧪 Environment Variables

Create a `.env` file or reference the format below:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/gridiron_guru
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin
```

---

### 🧠 Access pgAdmin

Open [http://localhost:5050](http://localhost:5050) in your browser.

**Login with:**

- Email: `admin@admin.com`
- Password: `admin`

**Add New Server:**

- Name: `GridironDB`
- Host: `db`
- Port: `5432`
- Username: `postgres`
- Password: `postgres`

## ✅ Next Steps

- Add database models with SQLAlchemy
- Add routes for weekly picks
- Connect to frontend via REST
