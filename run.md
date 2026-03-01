### Run the full Kafka demo

From `C:\Users\Kapil Singh\Desktop\kafka-goal`.

1. **Start all services with streaming logs**

   ```bash
   docker compose -f docker-compose.yaml up --build
   ```

   This starts:

   - `kafka1`, `kafka2`, `kafka3`
   - `producer`
   - `consumer1`, `consumer2`

2. **Create or fix the topic (3 partitions so both consumers share load)**

   Open a second terminal in the same folder and run:

   ```bash
   bash init-topic.sh
   ```

   This creates `demo-topic` with **3 partitions** if it doesn’t exist, or alters an existing topic to 3 partitions. Then restart consumers so they rebalance:

   ```bash
   docker compose -f docker-compose.yaml restart consumer1 consumer2
   ```

3. **What “working as expected” looks like**

   In the first terminal you should see:

   - **Producer**: lines like  
     `Producing: { key: 'key-X', value: 'Message-Y' }` every ~2 seconds.
   - **Consumers**: lines for **both** `consumer1` and `consumer2` with **Partition**, **Offset**, **Value** (with 3 partitions, Kafka splits them between the two consumers).

4. **Verify topic and consumer group (optional)**

   - Topic has 3 partitions:

     ```bash
     docker exec kafka1 kafka-topics --describe --topic demo-topic --bootstrap-server kafka1:19092
     ```

   - Both consumers are assigned partitions (CONSUMER-ID and CLIENT-ID should be filled, not `-`):

     ```bash
     docker exec kafka1 kafka-consumer-groups --describe --group group-A --bootstrap-server kafka1:19092
     ```

---

### Run only producer and consumers (brokers already up)

If Kafka brokers (`kafka1`, `kafka2`, `kafka3`) are already running:

- Foreground (with logs):

  ```bash
  docker compose -f docker-compose.yaml up --build producer consumer1 consumer2
  ```

- Background:

  ```bash
  docker compose -f docker-compose.yaml up -d producer consumer1 consumer2
  ```

---

### View logs

From the project root, in another terminal:

- **Producer logs**:

  ```bash
  docker compose -f docker-compose.yaml logs producer
  ```

- **Consumer 1 logs**:

  ```bash
  docker compose -f docker-compose.yaml logs consumer1
  ```

- **Consumer 2 logs**:

  ```bash
  docker compose -f docker-compose.yaml logs consumer2
  ```

- **Single broker logs (example: kafka1)**:

  ```bash
  docker logs kafka1
  ```

- **Only the latest lines (example: last 50 from consumer1)**:

  ```bash
  docker compose -f docker-compose.yaml logs --tail=50 consumer1
  ```

---

### Stop and reset

- Stop everything started with `up` (Ctrl + C in that terminal).

- Remove containers but **keep** Kafka data/topics:

  ```bash
  docker compose -f docker-compose.yaml down
  ```

- Remove containers **and** all Kafka data/topics (fresh cluster next time):

  ```bash
  docker compose -f docker-compose.yaml down -v
  ```