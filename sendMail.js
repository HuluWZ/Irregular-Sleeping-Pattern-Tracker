var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hulunlante.w@gmail.com',
    pass: '!!!!!!!!!!!!!!!!!!!'
  }
});

var mailOptions = {
  from: 'hulunlante.w@gmail.com',
  to: 'dano.hailu@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});