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

## ✅ Next Steps

- Add database models with SQLAlchemy
- Add routes for weekly picks
- Connect to frontend via REST or GraphQL
