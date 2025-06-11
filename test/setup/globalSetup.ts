import { Client } from 'pg';
import { execSync } from 'child_process';

// Connect to default "postgres" DB to create "poliapp_test"
module.exports = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    database: 'postgres' // must connect to an existing DB to create another
  });

  await client.connect();
  const dbName = process.env.DB_NAME || 'poliapp_test';

  // Drop and create the test DB fresh
  await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
  await client.query(`CREATE DATABASE ${dbName}`);
  await client.end();

  // Now run migrations
  execSync('npx typeorm-ts-node-commonjs migration:run -d src/config/data-source.ts');
};
