const { Kafka } = require('kafkajs')

const name = process.env.CONSUMER_NAME

const kafka = new Kafka({
  clientId: name,
  brokers: ['kafka1:19092','kafka2:19092','kafka3:19092']
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