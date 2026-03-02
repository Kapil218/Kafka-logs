const { Kafka } = require('kafkajs')

const kafka = new Kafka({
  clientId: 'advanced-producer',
  brokers: ['kafka1:19092', 'kafka2:19092', 'kafka3:19092']
})

const producer = kafka.producer({ idempotent: true })  // idempotent: true means that the messages will be sent exactly once


// this function will run the producer and send the messages to the topic
const run = async () => {
  await producer.connect()

  let counter = 1

  setInterval(async () => {
    const message = {
      key: `key-${counter % 3}`,    // we have 3 partitions so we need to distribute the messages between the partitions
      value: `Message-${counter}`   
    }

    console.log("Producing:", message)

    await producer.send({
      topic: 'demo-topic',
      messages: [message]
    })

    // -----------------------------------------------------------------------
    // Reference only (commented out):
    // Example of sending to a second topic (orders-topic) that has 2 partitions.
    // In that case you might use a modulo of 2 for keys, and have a separate
    // consumer group (orders-group) consuming from that topic.
    //
    // const ordersMessage = {
    //   key: `order-key-${counter % 2}`,
    //   value: `Order-${counter}`
    // }
    //
    // await producer.send({
    //   topic: 'orders-topic',
    //   messages: [ordersMessage]
    // })

    counter++
  }, 2000)
}

run()