const dovenv = require('dotenv');
const mongoose = require('mongoose');
const mydidAuth = require('@xsl-labs/mydid-auth');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

dovenv.config({ path: './config.env' });
const app = require('./app');

mongoose
  .connect(process.env.DATABASE_LOCAL, {})
  .then(() => console.log('DB connection successful !'));

try {
  mydidAuth.initialize({
    web3GivenProvider: process.env.WEB3_GIVEN_PROVIDER,
    smartContractAddress: process.env.SMART_CONTRACT_ADDRESS,
  });
} catch (err) {
  console.log('Error trying to initialize mydid-auth : ' + err);
}

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated !');
  });
});
