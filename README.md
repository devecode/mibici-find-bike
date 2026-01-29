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
CREATE INDEX idx_stations_geom ON stations USING GIST (geom);
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


