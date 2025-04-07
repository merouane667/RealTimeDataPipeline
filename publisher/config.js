module.exports = {
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'employee-publisher',
    brokers: process.env.KAFKA_BROKER ? [process.env.KAFKA_BROKER] : ['localhost:9092'],
    topic: process.env.KAFKA_TOPIC || 'employee-data'
  },
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'employees'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  publishInterval: parseInt(process.env.PUBLISH_INTERVAL) || 5000 // Default 5 seconds
};