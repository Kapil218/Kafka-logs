const { Kafka } = require('kafkajs')

const name = process.env.CONSUMER_NAME

const kafka = new Kafka({
  clientId: name,
  brokers: ['kafka1:19092','kafka2:19092','kafka3:19092']
})

const consumer = kafka.consumer({
  groupId: 'group-A'
})

// -----------------------------------------------------------------------------
// Reference only (commented out):
// Example of a second consumer group reading a different topic (orders-topic)
// with 2 partitions. To use it, you would create a second consumer instance
// (for example, another container) running this logic with groupId 'orders-group'
// and subscribing to 'orders-topic'.
//
// const ordersConsumer = kafka.consumer({
//   groupId: 'orders-group'
// })
//
// const runOrdersConsumer = async () => {
//   await ordersConsumer.connect()
//   await ordersConsumer.subscribe({ topic: 'orders-topic' })
//
//   await ordersConsumer.run({
//     eachMessage: async ({ topic, partition, message }) => {
//       console.log(
//         `[orders-consumer] 
//          Topic: ${topic}
//          Partition: ${partition}
//          Offset: ${message.offset}
//          Value: ${message.value.toString()}`
//       )
//     }
//   })
// }

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