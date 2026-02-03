# 🚲 MiBici Find Bike API

A scalable REST API to find nearby bike-sharing stations with real-time availability and concurrency-safe reservations.

Designed to simulate infrastructure ready for **10,000 stations** and **1M MAU**.


## 🧠 Architecture Overview

| Layer          | Tech                               |
| -------------- | ---------------------------------- |
| API            | Node.js 22 + Fastify               |
| Database       | PostgreSQL + PostGIS               |
| Spatial Index  | GiST on geography column           |
| Testing        | Vitest + Integration + Concurrency |
| Stress Testing | Autocannon                         |
| Docs           | OpenAPI (Swagger)                  |
| Infra          | Docker Compose                     |
| CI             | GitHub Actions (act compatible)    |


## 📍 Spatial Search Strategy

Nearby station search uses:

```sql
ST_DWithin(geom, point, radius)
```

Combined with:

```sql
CREATE INDEX stations_geom_gix ON stations USING GIST (geom);
```

This guarantees:

* No O(n) linear scans
* Logarithmic spatial lookup
* Scalability to large station counts

Distance ordering uses:

```sql
ST_Distance(...)
```


## ⚡ Real-Time Availability

Station availability is stored separately in:

```
station_inventory
```

This avoids heavy writes on station metadata and enables:

* Fast read joins
* Independent updates
* Clean separation of static vs dynamic data

## 🔒 Concurrency Strategy (Critical)

Bike reservations are protected using **atomic SQL updates**:

```sql
UPDATE station_inventory
SET available_bikes = available_bikes - 1
WHERE station_id = $1
  AND available_bikes > 0
RETURNING ...
```

Executed inside a transaction:

```
BEGIN → UPDATE → INSERT reservation → COMMIT
```

### Guarantees:

* No negative inventory
* No double reservations
* Correct behavior under race conditions


## 🧪 Concurrency Test

A test simulates **50 simultaneous reservation requests** when only **1 bike** is available.

Expected result:

| Result          | Count |
| --------------- | ----- |
| Success         | 1     |
| Conflict        | 49    |
| Final inventory | 0     |

This proves atomicity and consistency under load.

Run tests:

```bash
npm test
```


## 📈 Stress Testing

Using `autocannon`.

### Nearby search

```bash
npm run stress:nearby
```

### Mixed load (search + reserve)

```bash
npm run stress:mixed
```

Metrics to include in report:

* Requests/sec
* Latency p95
* Error rate


## 🧱 Data Model

### stations

Static metadata + geography

### station_inventory

Real-time bike/dock counters

### reservations

Reservation lifecycle (ACTIVE → COMPLETED)


## 🚀 Running Locally

**Requirements:** Docker + Node.js

```bash
docker compose up -d
npm install
npm run migrate
npm run seed
npm run dev
```

API → [http://localhost:3000](http://localhost:3000)
Docs → [http://localhost:3000/docs](http://localhost:3000/docs)


## 🧩 CRUD Operations

| Endpoint                   | Description    |
| -------------------------- | -------------- |
| GET /stations/nearby       | Spatial search |
| POST /stations             | Create station |
| DELETE /stations/:id       | Remove station |
| POST /stations/:id/reserve | Reserve bike   |
| POST /stations/:id/return  | Return bike    |


## 🔁 CI / Integration Flow

GitHub Actions pipeline:

1. Start PostGIS container
2. Run migrations
3. Run seeds
4. Execute integration + concurrency tests

Compatible with:

```bash
act
```


## 📘 API Documentation

Swagger UI:

```
http://localhost:3000/docs
```

---

## 🤖 AI Usage Report

AI (ChatGPT) was used as a development assistant, mainly to speed up repetitive setup tasks and to review architectural decisions. The tool helped reduce boilerplate time but all critical system decisions (database design, concurrency model, and test strategy) were validated manually.

At the beginning of the project, AI was used to help scaffold the environment, initialize the project structure, and configure basic tooling. These are simple tasks, but delegating them to AI reduced setup time and allowed more focus on system design.

---

### ❓ What AI suggestion did you reject and why?

Two important AI suggestions were rejected:

**1) Exposing credentials in the `.env` during initial setup**
AI initially generated examples that included hardcoded or exposed credentials. This was rejected because:

* It violates security best practices
* Credentials must never be committed or exposed
* The project instead uses environment variables safely injected via CI and local `.env` ignored by Git

**2) Using application-level locks (mutex in Node.js) for reservations**
AI suggested preventing concurrent reservations using a mutex or in-memory lock.

This was rejected because:

* It does **not scale horizontally**
* It fails when multiple API instances run behind a load balancer
* It breaks in distributed systems

Instead, the final solution uses **database-level concurrency control** with atomic SQL updates inside transactions:

```sql
UPDATE station_inventory
SET available_bikes = available_bikes - 1
WHERE station_id = $1 AND available_bikes > 0
RETURNING ...
```

This guarantees correctness even under high concurrency and multiple service instances.

---

### ⚠️ How did you detect and correct an AI hallucination or security issue?

While implementing the concurrency tests, AI began suggesting code changes unrelated to the current project structure and even hinted at exposing database passwords. This indicated the responses were drifting away from the actual code context.

A concrete technical issue occurred when AI suggested a simple update for test setup:

```sql
UPDATE station_inventory SET ...
```

This would silently fail if the row did not exist, because PostgreSQL would return `rowCount = 0`. That would make concurrency tests unreliable in CI.

The issue was detected by understanding PostgreSQL behavior and noticing that the race test depended on existing rows.

It was corrected by implementing an **UPSERT + ensureStation strategy**:

* Insert station if missing
* Insert inventory if missing
* Otherwise update

This made tests deterministic, idempotent, and CI-safe.

---

### 💡 What was the most interesting prompt?

The most impactful prompt used was:

> **"Design a concurrency-safe reservation system in PostgreSQL that prevents overselling inventory under 50+ simultaneous requests without using application locks."**

This helped validate:

* Transaction design
* Atomic updates
* Use of `RETURNING`
* PostgreSQL row-level locking behavior

It directly influenced the final reservation architecture.

---

### 🧠 Summary

AI was used as a productivity and review tool, not as an autonomous developer. All critical decisions related to scalability, concurrency, and security were verified against database behavior and distributed system principles.

---



