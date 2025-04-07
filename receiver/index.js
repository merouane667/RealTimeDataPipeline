const { Kafka } = require('kafkajs');
const config = require('./config');

// Configuration Kafka
const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers
});

const consumer = kafka.consumer({ groupId: config.kafka.groupId });

// Fonction pour traiter un message d'employé
function processEmployeeMessage(employee) {
  // Calcul du salaire annuel
  const annualSalary = employee.salary * 12;
  
  // Calcul de l'ancienneté (années)
  const hireDate = new Date(employee.hire_date);
  const today = new Date();
  const yearsOfService = Math.floor((today - hireDate) / (365.25 * 24 * 60 * 60 * 1000));
  
  // Analyse des données
  console.log(`\n--- Employee Analysis ---`);
  console.log(`Employee: ${employee.employee_name} (ID: ${employee.emp_no})`);
  console.log(`Department: ${employee.dept_name} (${employee.dept_no})`);
  console.log(`Position: ${employee.title}`);
  console.log(`Gender: ${employee.gender}`);
  console.log(`Hired on: ${new Date(employee.hire_date).toLocaleDateString()}`);
  console.log(`Years of service: ${yearsOfService}`);
  console.log(`Monthly salary: $${employee.salary}`);
  console.log(`Annual salary: $${annualSalary}`);
  
  // Classification salariale simplifiée
  let salaryCategory;
  if (employee.salary < 40000) salaryCategory = "Entry Level";
  else if (employee.salary < 65000) salaryCategory = "Mid Level";
  else if (employee.salary < 90000) salaryCategory = "Senior Level";
  else salaryCategory = "Executive Level";
  
  console.log(`Salary category: ${salaryCategory}`);
  console.log(`---------------------`);
  
  return {
    employeeDetails: employee,
    analysis: {
      annualSalary,
      yearsOfService,
      salaryCategory
    }
  };
}

// Fonction principale
async function main() {
  try {
    // Connexion au consumer Kafka
    await consumer.connect();
    console.log('Connected to Kafka consumer');
    
    // Abonnement au topic
    await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: true });
    console.log(`Subscribed to topic: ${config.kafka.topic}`);
    
    // Traitement des messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const employeeData = JSON.parse(message.value.toString());
          const messageType = message.headers['message-type']?.toString();
          const timestamp = message.headers['timestamp']?.toString();
          
          console.log(`\nReceived message from partition ${partition}, offset ${message.offset}`);
          console.log(`Message type: ${messageType}, timestamp: ${new Date(parseInt(timestamp)).toISOString()}`);
          
          // Traitement des données d'employé
          const result = processEmployeeMessage(employeeData);
          
          // Ici, vous pourriez faire d'autres traitements avec le résultat,
          // comme l'enregistrer dans une autre base de données, l'envoyer vers une API, etc.
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Gestion des erreurs et fermeture propre
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await consumer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await consumer.disconnect();
  process.exit(0);
});

// Démarrage de l'application
main().catch(console.error);