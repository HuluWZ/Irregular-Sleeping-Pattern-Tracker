var mysql = require('mysql');
//const app = require('./app');
var dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

var conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

conn.connect(function (err) {
  if (err) {
    console.log("Unable To Connect Database.");
    throw err
  };
  console.log(" Connected To DB ..... ");
});

module.exports = conn;