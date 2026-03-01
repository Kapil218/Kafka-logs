const { Kafka } = require('kafkajs')

const kafka = new Kafka({
  clientId: 'advanced-producer',
  brokers: ['kafka1:19092', 'kafka2:19092', 'kafka3:19092']
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