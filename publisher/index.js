const { Kafka } = require('kafkajs');
const mysql = require('mysql2/promise');
const Redis = require('ioredis');
const config = require('./config');

// Configuration Kafka
const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers
});

// Initialize Redis client
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port
});

// Set cache TTL (time to live) in seconds
const CACHE_TTL = 3600; // 1 hour
const CACHE_KEY = 'employee_data';

const producer = kafka.producer();
let connection;
let employees = []; // Store the first 10 employees
let currentEmployeeIndex = 0; // Track the index of the current employee

// Check if data exists in Redis cache
async function getDataFromCache() {
  try {
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      console.log('Using cached employee data');
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error('Redis cache error:', error);
    return null;
  }
}

// Save data to Redis cache
async function saveDataToCache(data) {
  try {
    await redis.set(CACHE_KEY, JSON.stringify(data), 'EX', CACHE_TTL);
    console.log('Employee data cached successfully');
  } catch (error) {
    console.error('Error caching employee data:', error);
  }
}

async function fetchEmployeeData() {
  try {
    // Try to get data from cache first
    const cachedEmployees = await getDataFromCache();
    if (cachedEmployees && cachedEmployees.length > 0) {
      employees = cachedEmployees;
      console.log(`Retrieved ${employees.length} employees from cache`);
      return;
    }

    // If no cached data, fetch from database
    if (!connection) {
      connection = await mysql.createConnection(config.mysql);
      console.log('MySQL connection established');
    }
    
    // Use a very specific set of employee IDs instead of a range
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
        ORDER BY e.emp_no ASC
        LIMIT 10
    `);

    if (rows.length > 0) {
      employees = rows.map(row => {
        // Format dates properly for serialization
        if (row.hire_date instanceof Date) {
          return {
            ...row,
            hire_date: row.hire_date.toISOString().split('T')[0]
          };
        }
        return row;
      });
      console.log(`Fetched ${employees.length} employees from database`);
      
      // Cache the results
      await saveDataToCache(employees);
    } else {
      console.log('No employee data found');
    }
  } catch (error) {
    console.error('Error fetching employee data:', error);
  }
}

// Function to publish an employee to Kafka
async function publishEmployeeData() {
  try {
    if (employees.length === 0) {
      console.log('No employee data to publish');
      return;
    }

    // Publish one employee at a time
    const employee = employees[currentEmployeeIndex];

    // Prepare the employee data for sending
    const preparedEmployee = {
      ...employee,
      hire_date: employee.hire_date instanceof Date ? employee.hire_date.toISOString() : employee.hire_date
    };

    // Send data to Kafka
    await producer.send({
      topic: config.kafka.topic,
      messages: [{
        key: String(employee.emp_no),
        value: JSON.stringify(preparedEmployee),
        headers: {
          'message-type': 'employee-data',
          'timestamp': Date.now().toString()
        }
      }]
    });

    console.log(`Published employee ${employee.emp_no} to Kafka`);

    // Move to the next employee
    currentEmployeeIndex = (currentEmployeeIndex + 1) % employees.length; // Return to the beginning after sending all employees

  } catch (error) {
    console.error('Error publishing employee data:', error);
  }
}

// Main function
async function main() {
  try {
    // Connect to Kafka producer
    await producer.connect();
    console.log('Connected to Kafka producer');

    // Retrieve employee data once at the beginning
    await fetchEmployeeData();

    // Continuous publication of employees
    console.log(`Starting to publish employee data every ${config.publishInterval / 1000} seconds`);

    // Immediate publication the first time
    await publishEmployeeData();

    // Publish in an infinite loop
    setInterval(publishEmployeeData, config.publishInterval);
    
    // Refresh cache periodically (every CACHE_TTL/2 seconds to ensure fresh data)
    setInterval(fetchEmployeeData, (CACHE_TTL/2) * 1000);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Error handling and clean shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (connection) await connection.end();
  await producer.disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (connection) await connection.end();
  await producer.disconnect();
  await redis.quit();
  process.exit(0);
});

// Start the application
main().catch(console.error);