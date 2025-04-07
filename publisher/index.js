const { Kafka } = require('kafkajs');
const mysql = require('mysql2/promise');
const config = require('./config');

// Configuration Kafka
const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers
});

const producer = kafka.producer();
let connection;

// Fonction pour récupérer les données des employés
async function fetchEmployeeData() {
  try {
    if (!connection) {
      connection = await mysql.createConnection(config.mysql);
      console.log('MySQL connection established');
    }

    // Requête SQL avec jointures pour récupérer les données des employés
    const [rows] = await connection.execute(`
      SELECT 
        e.emp_no,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.gender,
        e.hire_date,
        d.dept_no,
        d.dept_name,
        t.title,
        s.salary
      FROM 
        employees e
      INNER JOIN 
        dept_emp de ON e.emp_no = de.emp_no
      INNER JOIN 
        departments d ON de.dept_no = d.dept_no
      INNER JOIN 
        titles t ON e.emp_no = t.emp_no
      INNER JOIN 
        salaries s ON e.emp_no = s.emp_no
      WHERE 
        de.to_date = '9999-01-01'
        AND t.to_date = '9999-01-01'
        AND s.to_date = '9999-01-01'
      ORDER BY RAND()
      LIMIT 10
    `);

    if (rows.length > 0) {
      return rows;
    }
    
    console.log('No employee data found');
    return [];
  } catch (error) {
    console.error('Error fetching employee data:', error);
    return [];
  }
}

// Fonction pour publier les données dans Kafka
async function publishEmployeeData() {
  try {
    const employees = await fetchEmployeeData();
    
    if (employees.length === 0) {
      console.log('No employee data to publish');
      return;
    }

    // Convertir les dates en chaînes pour la sérialisation JSON
    const preparedEmployees = employees.map(emp => {
      return {
        ...emp,
        hire_date: emp.hire_date instanceof Date ? emp.hire_date.toISOString() : emp.hire_date
      };
    });

    // Envoi des données à Kafka
    await producer.send({
      topic: config.kafka.topic,
      messages: preparedEmployees.map(employee => ({
        key: String(employee.emp_no),
        value: JSON.stringify(employee),
        headers: {
          'message-type': 'employee-data',
          'timestamp': Date.now().toString()
        }
      }))
    });

    console.log(`Published ${employees.length} employee records to Kafka`);
  } catch (error) {
    console.error('Error publishing employee data:', error);
  }
}

// Fonction principale
async function main() {
  try {
    // Connexion au producer Kafka
    await producer.connect();
    console.log('Connected to Kafka producer');

    // Publication périodique des données
    console.log(`Starting to publish data every ${config.publishInterval / 1000} seconds`);
    
    // Publication immédiate une première fois
    await publishEmployeeData();
    
    // Configuration de la publication périodique
    setInterval(publishEmployeeData, config.publishInterval);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Gestion des erreurs et fermeture propre
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (connection) await connection.end();
  await producer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (connection) await connection.end();
  await producer.disconnect();
  process.exit(0);
});

// Démarrage de l'application
main().catch(console.error);