const dotenv = require('dotenv');
const mysql = require('mysql');
const app = require('./app');

dotenv.config({ path: './config.env' });

const port = process.env.PORT || 3000;


var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

con.connect(function (err) {
  if (err) {   console.log("Unable To Connect Database.");
throw err };
  console.log("Connected TO sleep Pattern Tracker Successfully ");
});
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});