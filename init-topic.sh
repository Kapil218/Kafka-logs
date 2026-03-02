#!/bin/bash
# Create demo-topic with 3 partitions, or alter existing topic to 3 partitions.
# Run after Kafka brokers are up (e.g. after docker compose up).

set -e
BOOTSTRAP="kafka1:19092"

echo "Ensuring topic demo-topic exists with 3 partitions..."
if docker exec kafka1 kafka-topics \
  --create \
  --topic demo-topic \
  --partitions 3 \
  --replication-factor 2 \
  --bootstrap-server "$BOOTSTRAP" \
  --config retention.ms=60000 2>/dev/null; then
  echo "Created topic demo-topic with 3 partitions."
else
  echo "Topic demo-topic already exists; ensuring it has 3 partitions..."
  docker exec kafka1 kafka-topics \
    --alter \
    --topic demo-topic \
    --partitions 3 \
    --bootstrap-server "$BOOTSTRAP"
  echo "Topic demo-topic now has 3 partitions."
fi

echo "Done. Restart consumers to rebalance: docker compose -f docker-compose.yaml restart consumer1 consumer2"

# -----------------------------------------------------------------------------
# Reference only (commented out): example of a second topic + consumer group
# -----------------------------------------------------------------------------
#
# The block below shows how you could manage another topic (orders-topic) with
# 2 partitions, to be consumed by a separate consumer group (e.g. orders-group).
# It is commented out so it does NOT run by default.
#
# echo "Ensuring topic orders-topic exists with 2 partitions..."
# if docker exec kafka1 kafka-topics \
#   --create \
#   --topic orders-topic \
#   --partitions 2 \
#   --replication-factor 2 \
#   --bootstrap-server "$BOOTSTRAP" 2>/dev/null; then
#   echo "Created topic orders-topic with 2 partitions."
# else
#   echo "Topic orders-topic already exists; ensuring it has 2 partitions..."
#   docker exec kafka1 kafka-topics \
#     --alter \
#     --topic orders-topic \
#     --partitions 2 \
#     --bootstrap-server "$BOOTSTRAP"
#   echo "Topic orders-topic now has 2 partitions."
# fi
