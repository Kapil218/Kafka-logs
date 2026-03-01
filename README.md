# Kafka goal – 3-broker KRaft demo

Local Kafka cluster (KRaft) with a producer and two consumers sharing 3 partitions.

---

## Quick start

From the project root:

```bash
docker compose -f docker-compose.yaml up --build
```

In a second terminal:

```bash
bash init-topic.sh
docker compose -f docker-compose.yaml restart consumer1 consumer2
```

See **[run.md](run.md)** for the full run flow, logs, and verification commands.

---

## Architecture

```text
                ┌──────────────┐
                │  Producer    │
                └──────┬───────┘
                       │
                ┌──────▼──────────────┐
                │   Kafka Cluster     │
                │  (3 Brokers, KRaft) │
                │  Topic: demo-topic   │
                │  Partitions: 3       │
                └──────┬───────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
  Consumer-1 (group-A)         Consumer-2 (group-A)
```

- **Brokers**: `kafka1`, `kafka2`, `kafka3` (Confluent KRaft, port 19092).
- **Topic**: `demo-topic` — 3 partitions so both consumers share the load.
- **Consumer group**: `group-A` — each partition is consumed by exactly one of the two consumers.

---

## Project structure

```text
kafka-goal/
├── docker-compose.yaml   # 3 Kafka brokers + producer + consumer1 + consumer2
├── init-topic.sh         # Create or alter demo-topic to 3 partitions
├── run.md                # Step-by-step run and verify instructions
├── producer/
│   ├── package.json
│   ├── producer.js
│   └── Dockerfile
└── consumer/
    ├── package.json
    ├── consumer.js
    └── Dockerfile
```

---

## What this demo shows

- **KRaft** — no Zookeeper; 3 brokers with combined broker+controller role.
- **Topic** — `demo-topic` with 3 partitions (create or alter via `init-topic.sh`).
- **Consumer group** — both consumers in `group-A`; Kafka assigns partitions between them.
- **Producer** — sends messages every ~2 s with keys for partition distribution.
- **Offsets** — consumers commit offsets; you can inspect with `kafka-consumer-groups --describe --group group-A`.

---

## Run and verify (summary)

| Step | Command |
|------|--------|
| Start all | `docker compose -f docker-compose.yaml up --build` |
| Topic (3 partitions) | `bash init-topic.sh` then `docker compose -f docker-compose.yaml restart consumer1 consumer2` |
| Describe topic | `docker exec kafka1 kafka-topics --describe --topic demo-topic --bootstrap-server kafka1:19092` |
| Describe group | `docker exec kafka1 kafka-consumer-groups --describe --group group-A --bootstrap-server kafka1:19092` |
| Stop (keep data) | `docker compose -f docker-compose.yaml down` |
| Stop + wipe data | `docker compose -f docker-compose.yaml down -v` |

Full details, logs, and optional steps: **[run.md](run.md)**.

---

## Producer / consumer (concept)

**Producer** (`producer/producer.js`) — connects to `kafka1:19092`, `kafka2:19092`, `kafka3:19092`, sends to `demo-topic` with keys `key-0`, `key-1`, `key-2` in a loop.

**Consumer** (`consumer/consumer.js`) — same brokers, subscribes to `demo-topic`, uses `groupId: 'group-A'`. Each message is delivered to exactly one consumer in the group; with 3 partitions and 2 consumers, Kafka splits partitions between them.

---

## Experiments

- **Kill a broker**: `docker stop kafka2` — cluster keeps serving (other brokers and replication).
- **Add a 3rd consumer**: run another consumer in `group-A` — partitions rebalance.
- **Different group**: use another `groupId` — that group will also receive all messages (each group gets a full copy).

---

## Requirements

- Docker and Docker Compose.
- Bash (for `init-topic.sh`) — e.g. Git Bash or WSL on Windows.
