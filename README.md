                ┌──────────────┐
                │  Producer    │
                └──────┬───────┘
                       │
                ┌──────▼──────────────┐
                │   Kafka Cluster     │
                │  (3 Brokers, KRaft) │
                │                      │
                │  Topic: demo-topic   │
                │  Partitions: 3       │
                │  Replication: 2      │
                └──────┬───────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
  Consumer-1 (group-A)         Consumer-2 (group-A)






  Perfect — now we’ll build a **realistic local KRaft cluster** that demonstrates:

* ✅ Multiple **brokers**
* ✅ Dedicated **controllers** (KRaft quorum)
* ✅ Topic with multiple **partitions**
* ✅ **Replication factor**
* ✅ **Consumer group**
* ✅ **Offsets**
* ✅ **Retention policy**
* ✅ Producer + 2 consumers
* ✅ Proper distribution across partitions

This is close to how production Kafka is structured.

---

# 🧱 Final Architecture

```text
                ┌──────────────┐
                │  Producer    │
                └──────┬───────┘
                       │
                ┌──────▼──────────────┐
                │   Kafka Cluster     │
                │  (3 Brokers, KRaft) │
                │                      │
                │  Topic: demo-topic   │
                │  Partitions: 3       │
                │  Replication: 2      │
                └──────┬───────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
  Consumer-1 (group-A)         Consumer-2 (group-A)
```

---

# 📦 Project Structure

```bash
kafka-advanced-kraft/
│
├── docker-compose.yml
├── init-topic.sh
├── producer/
└── consumer/
```

---

# 1️⃣ docker-compose.yml (3 Brokers + KRaft)

We’ll use Bitnami Kafka in KRaft mode.

```yaml
version: "3.8"

services:

  kafka1:
    image: bitnami/kafka:3.6
    hostname: kafka1
    container_name: kafka1
    ports:
      - "9092:9092"
    environment:
      - KAFKA_ENABLE_KRAFT=yes
      - KAFKA_KRAFT_CLUSTER_ID=kraft-cluster-demo
      - KAFKA_CFG_NODE_ID=1
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka1:9093,2@kafka2:9093,3@kafka3:9093
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka1:9092
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      - ALLOW_PLAINTEXT_LISTENER=yes

  kafka2:
    image: bitnami/kafka:3.6
    hostname: kafka2
    container_name: kafka2
    environment:
      - KAFKA_ENABLE_KRAFT=yes
      - KAFKA_KRAFT_CLUSTER_ID=kraft-cluster-demo
      - KAFKA_CFG_NODE_ID=2
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka1:9093,2@kafka2:9093,3@kafka3:9093
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka2:9092
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      - ALLOW_PLAINTEXT_LISTENER=yes

  kafka3:
    image: bitnami/kafka:3.6
    hostname: kafka3
    container_name: kafka3
    environment:
      - KAFKA_ENABLE_KRAFT=yes
      - KAFKA_KRAFT_CLUSTER_ID=kraft-cluster-demo
      - KAFKA_CFG_NODE_ID=3
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka1:9093,2@kafka2:9093,3@kafka3:9093
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka3:9092
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      - ALLOW_PLAINTEXT_LISTENER=yes

  producer:
    build: ./producer
    depends_on:
      - kafka1
      - kafka2
      - kafka3

  consumer1:
    build: ./consumer
    environment:
      - CONSUMER_NAME=consumer-1
    depends_on:
      - kafka1

  consumer2:
    build: ./consumer
    environment:
      - CONSUMER_NAME=consumer-2
    depends_on:
      - kafka1
```

---

# 2️⃣ Create Topic with Partitions + Replication + Retention

After cluster starts:

```bash
docker exec -it kafka1 kafka-topics.sh \
  --create \
  --topic demo-topic \
  --partitions 3 \
  --replication-factor 2 \
  --bootstrap-server kafka1:9092 \
  --config retention.ms=60000
```

This means:

* 3 partitions
* Replication factor 2
* Data retained only 60 seconds

---

# 3️⃣ Producer (Advanced)

Use multiple brokers:

```js
const { Kafka } = require('kafkajs')

const kafka = new Kafka({
  clientId: 'advanced-producer',
  brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092']
})

const producer = kafka.producer({ idempotent: true })

const run = async () => {
  await producer.connect()

  let counter = 1

  setInterval(async () => {
    const message = {
      key: `key-${counter % 3}`,
      value: `Message-${counter}`
    }

    console.log("Producing:", message)

    await producer.send({
      topic: 'demo-topic',
      messages: [message]
    })

    counter++
  }, 2000)
}

run()
```

Key ensures distribution across partitions.

---

# 4️⃣ Consumer (Offset + Partition Awareness)

```js
const { Kafka } = require('kafkajs')

const name = process.env.CONSUMER_NAME

const kafka = new Kafka({
  clientId: name,
  brokers: ['kafka1:9092','kafka2:9092','kafka3:9092']
})

const consumer = kafka.consumer({
  groupId: 'group-A'
})

const run = async () => {
  await consumer.connect()
  await consumer.subscribe({ topic: 'demo-topic' })

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(
        `[${name}] 
         Partition: ${partition} 
         Offset: ${message.offset}
         Value: ${message.value.toString()}`
      )
    }
  })
}

run()
```

---

# 🔍 What You Are Demonstrating

## 1️⃣ Brokers

You have 3 independent broker nodes.

## 2️⃣ Partitions

`--partitions 3`
Messages distributed across partitions.

## 3️⃣ Replication

`--replication-factor 2`
Each partition has:

* 1 Leader
* 1 Follower

Kill one broker → cluster still works.

## 4️⃣ Consumer Group

Both consumers use:

```js
groupId: 'group-A'
```

Kafka balances partitions across them.

## 5️⃣ Offsets

Printed in logs:

```
Offset: 15
Offset: 16
```

Stored in internal topic:

```
__consumer_offsets
```

## 6️⃣ Retention

`retention.ms=60000`
Messages deleted after 60 seconds.

---

# 🧪 Experiments You Should Try

### 🔥 Kill a broker

```bash
docker stop kafka2
```

Cluster still works (replication).

---

### 🔥 Start a 3rd consumer

It will rebalance partitions automatically.

---

### 🔥 Change group ID

Change `groupId` → it will reprocess from beginning.

---

# 🧠 This Demo Covers

* KRaft quorum controllers
* Multi-broker cluster
* Topic partitioning
* Replication
* Leader election
* Consumer group rebalancing
* Offset storage
* Retention policy
* Idempotent producer

---

If you want next-level:

* Add transaction producer
* Add DLQ topic
* Add manual commit
* Add exactly-once semantics
* Add Kafka UI
* Add monitoring (JMX + Prometheus)
* Simulate network partition

Tell me how production-grade you want this to be.
