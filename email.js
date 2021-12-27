const nodemailer = require('nodemailer');
require('dotenv').config({path:'./config'});
//const nodemailMailgun = require('nodemailer-mailgun-transport');

//const sendEmail = async => {
  // 1) Create a transporter
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

*//*
    const auth = {
      auth: {
       api_key: '0dc945e9c85a777dec26b93ada3d97d2-64574a68-300668bf',
       domain: 'sandbox48abc7e529f348edb455aea472af2f18.mailgun.org'
      }
    };
    */
  var transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Sleeping Pattern Tracker <hulunlante.worku@outlook.com>',
    to: 'hulunlante.w@gmail.com',//options.email,
    subject: 'Sample Email Sent',//options.subject,
    text: 'NOdemailer'//options.message,
  };
  // 3) Actually send the email
  transporter.sendMail(mailOptions, function (err, data) {
    
    if (err) {
      console.error(err);
      return;
    } else {
      console.log(`Message Sent To ${mailOptions.to} !!!`);
    }
    
  });

//};
//sendMail();

//module.exports = sendEmail;
