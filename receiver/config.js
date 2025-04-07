module.exports = {
    kafka: {
      clientId: 'employee-receiver',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      topic: 'employee-data',
      groupId: 'employee-processor-group'
    }
  };