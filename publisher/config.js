module.exports = {
    kafka: {
      clientId: 'employee-publisher',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      topic: 'employee-data'
    },
    mysql: {
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      database: process.env.MYSQL_DATABASE || 'employees'
    },
    // Intervalle d'envoi des données en millisecondes (30 secondes)
    publishInterval: 30000
  };