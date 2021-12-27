const express = require('express');
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const connection = require('./dbConn');
var  _ = require('lodash');
const crypto= require('crypto');
const { min } = require('moment');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

//require('./authSocialController');
// TIME DURATION 
var moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);


// ASYNC  DATABASE CONNECTION 
function makeDB(connection) {
  return {
    query(sql, args) {
      return promisify(connection.query).call(connection, sql, args);
    }, close() {
      return promisify(connection.end).call(connection);
  }}
}

const connectionAsync = makeDB(connection);
 // Sign Token to identify a user
const signToken = id => {
  return jwt.sign({id},process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};


// Send JWT Token as user login or sign in
const createSendToken = (user, statusCode, req, res) => {

  const token = signToken(user.id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  res.cookie('jwt', token, cookieOptions); 
};


exports.logout = (req, res) => {
   res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
   });
  res.render('login');
   
};

exports.protect = async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
   return res.render('login', {
        message: "You are Not Logged In"
      });    /*res.status(403).json({
      status: "Fail",
      message: "You are not  logged in"
    });*/
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const [currentUser] = await connectionAsync.query("Select * from users where id = ?", decoded.id);
  if (currentUser == undefined) {
    return res.status(403).json({
      status: "Fail",
      message: "User does not exist"
    });
  };

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser.id;
  res.locals.user = currentUser.id;
  return next();
};

exports.protectFromNewUsers = catchAsync(async function (req, res, next) {
  // Get user data req.user
  const userId = req.user;
  console.log(userId);
  // Querying Sleeping 
  const sql = "Select * from sleep where userId = ?"

  const [result] = await connectionAsync.query(sql, [userId]);
  //console.log(result);
  if (result == undefined || !result) {
    return res.sendStatus(404).json({
      status: "Fail", message: "Un Authorized To View Chart "
    });
  }
  next();
});


 // GET USERS SLEEP TIME , DURATION OF USER ON ADD ,UPDATE , DELETE ENTRY 
exports.getUserSleepData = async function (req, res) {
  const userId = req.user
  //const [user] = await connectionAsync.query("select username from users where id =?", [userId]);
  console.log("User Id from Middleware : " + userId);
  const sql = `Select sleepTime , duration from sleep where userId = ${userId}`;
  var data = await connectionAsync.query(sql);

  if (data == undefined) {
    res.status(403).json({
      status: "Fail",
      message: "You are a New User!"
    });
  }
  //const username = user.username;
  //console.log(username);

   data = data.map((mysqlObj, index) => {
    return Object.assign({}, mysqlObj);
  });
  
  //console.log(data);
  
  return res.send({
     data
   });

};
// Get user id, email ,username
exports.getUserInfo = async  function (req, res) {
  const userId = req.user;
  const sql = `Select id , username, email from users where id = ?`;
  var data = await connectionAsync.query(sql,[userId]);

  if (data == undefined) {
    res.status(403).json({
      status: "Fail",
      message: "You are a New User!"
    });
  }
  data = data.map((mysqlObj, index) => {
    return Object.assign({}, mysqlObj);
  });

  res.send({
    data
  });

};

// Restrict Only Users Can Add, Update, Delete Entry 
exports.restrictTo =  (roles) => {
  return async (req, res, next) => {
    const userId = req.user;
    const [rolesUser] = await connectionAsync.query('Select roles from users where id = ?', [userId]);
    // console.log(rolesUser.roles);
    if (roles !== rolesUser.roles) {
      res.status(403).json(
        { status: "Fail", message: "Access Denied" });
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};


exports.signup = catchAsync(async function (req, res, next) {
  try {
    // 1) Encrypt Password & Check Email is NotUsed
    var { username, email, password } = req.body;
    const sql = 'select * from users where email = ?';

    //2) Checks For Email is Uniqueness
    const [result] = await connectionAsync.query(sql, [email]);//, async function (err, result) {
    // If an email already Registered by A User
     console.log(result);
    if (result !== undefined) {
     return res.render('register', {
        message: "Invalid Email or Password. Try later"
      });
    }
           //3) Encrypt Password
    password = await bcrypt.hash(password, 10);
         // 4) Create NewUser Object
    var data = [username, String(email), password];
    var sqlInsert = "INSERT INTO users  (username, email, password) values (?)";
         // 5) INSERT THE Data in the DB
    await connectionAsync.query(sqlInsert, [data]);
        // Return inserted Object
    const [newUser] = await connectionAsync.query("select * from users where email = ?", [String(email)]);
   console.log(`Sign Successfully /n Welcome ${username}!.`);
    res.status(200).redirect('/login');
    next();

  } catch (err) {
    console.error(err);
  }

});

exports.login = catchAsync(async function (req, res) {
  try {
    const { email, password } = req.body;
              // 1) Check if email and password exist
    const sql = "select * from users where email = ?";
    //2) GEt Username in DB & compare The Passwords
    const [result] = await connectionAsync.query(sql, [email]);
     console.log(result);
    if (Object.keys(result).length === 0) {
      res.render('register', {
        message: "Invalid Email or Password. Try later"
      });
    }
    else if (result.roles === 'admin') {
          createSendToken(result, 200, req, res);
      res.redirect('/dashboard');
    }
     //3) Compare Entered Password From DB Password
    var PasswordMatch = await bcrypt.compare(password, result.password);
   // console.log(`Match Password : ${PasswordMatch}`);
     
    if (!PasswordMatch) {
        return res.render('register', {
        message: "Invalid Email or Password. Try later"
      });

      /*return res.status(404).json({
        status: 'Login Failed',
        message: `Incorrect Email Or Password .`
      });*/
    }

  // 4) If everything ok, send token to client
    createSendToken(result, 200, req, res);
    res.status(200).redirect('/profile');
  } catch (err) {
    console.error(err);
  }

});

exports.forgotPassword = catchAsync(async  function(req, res, next) {
    // 1)Get Username or email from user
  const email = req.body.email;
  try{
    // 2) Check if username or email already exists
  var resetToken, passwordResetToken, passwordResetExpires,resetURL, message;

  const sql = " SELECT  *  FROM users WHERE  email = ? ";
  
    const [result]= await connectionAsync.query(sql, [email]);
    if ( !result) {
      return res.status(400).json({
        status: "Fail",
        message: "Email does not exist. "
      });
    }

       resetToken = crypto.randomBytes(32).toString('hex');
       passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
       passwordResetExpires = Date.now() + 20 * 60 * 1000;  // Expires in 20 min
       console.log(`Stored Data : ${passwordResetToken} \n Original Data :${resetToken} `);

    console.log(`Token :${resetToken}`);
  
    resetURL = `/resetPassword/${resetToken}`;
    message = `Forgot your password? Submit a a resetToken with your new password  ${resetURL}.\n 
                   If you didn't forget your password, please ignore this email!`;

  // 3) Send it to user's email  
    const sqlUpdate = "Update  users set passwordResetToken = ? , passwordResetExpires =  ? where email = ? ";

    await connectionAsync.query(sqlUpdate, [passwordResetToken, passwordResetExpires, email])
     
    res.redirect(resetURL)
      // SEND MAIL TO USER Try Version
    
    /*
     await sendEmail({
      email: email,
      subject: 'Account Activation Link (valid for 20 min)',
      message

    });*/
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
const msg = {
   to: email,
   from: 'hulunlante.w@gmail.com', // Use the email address or domain you verified above
   subject: 'Account Activation Link (valid for 20 min)', // Subject of  A Mail
   text: message // The  text to be sent
};

    sgMail.send(msg)
      .then(() => {
           console.log('Email sent Successfully ✌️')
           });
    
  }catch (err) {
      console.log(err)
    const sql = "update  users set passwordResetToken = NULL , passwordResetExpires = NULL where email = ?";
    //const sql = "insert into users (passwordResetToken,passwordResetExpires)  select passwordResetToken,passwordResetExpires from users where email= ?";
      await connectionAsync.query(sql, [email]);
    
  }
      
});

exports.resetPassword = catchAsync(async function (req, res, next) {
// 1) Get user based on the token
  let hashedToken = '';
  console.log(req.body.token);
  try {
     hashedToken = crypto
    .createHash('sha256')
    .update(req.body.token)
    .digest('hex');
   } catch (err) {
    // token expired
    return res.sendStatus(401);
  } 
  // 1) Search  token in the DB check of it's there or 
  try {
  const sql = "SELECT * from users where passwordResetToken = ? AND passwordResetExpires > ? ";
  const now = Date.now();
  const [user] = await connectionAsync.query(sql, [hashedToken, now]);
  if (!user ) {
    return res.send(401);
  }
  const { password, passwordConfirm } = req.body;
  if (password === passwordConfirm) {
    const newPasswordHash = await bcrypt.hash(password, 10);
    const passwordChangedAt = String(Date.now());
    const sqlUpdate = " update users set password= ? , passwordResetToken = NULL , passwordResetExpires = NULL where email = ? ";
    const result = await connectionAsync.query(sqlUpdate, [newPasswordHash,user.email]);
    console.log(result);
    //return res.status(200).send(result);
    res.render('login');
  } else {
    return res.send(400);
    }
  }
  catch (err) {
    console.error(err)
    return res.sendStatus(500);
  }
});

      ///\\\ SLEEP CONTROLLERS   
async function calculateDuration(start, end) {
  
    var startTime = start.split('T')[1];
    var endTime = end.split('T')[1];

    var startsSec = startTime.split(':');
    var endsSec = endTime.split(':');

    var TotStartSec = parseInt(startsSec[0]) * 60 + parseInt(startsSec[1]);
    var TotEndSec = parseInt(endsSec[0]) * 60 + parseInt(endsSec[1]);

    if (parseInt(startsSec[0]) > parseInt(endsSec[0])) {
    return -1;
    }

  const minDuration = Math.abs(TotEndSec - TotStartSec);
 
  if (minDuration <= 0){
    return 0;
    }
    
  const time = moment.duration(minDuration, "minutes").format();

  return time;
}

              /////\\\\\ ADD  ENTRY \\\\////

exports.addEntry = async function (req, res, next) {

  try {
    //const wakeupTime = req.body.wakeupTime;
    const sleep = req.body.sleepTime;
    const wake = req.body.wakeupTime;

    console.log(sleep + "  " + wake);
    
    const userId = req.user;
    console.log(userId);
    // check if Database have the same Sleep Starting Time 

    const sqlCheck = `select * from sleep where sleepTime between cast ('${sleep}' As DateTime) and cast ('${wake}' As DateTime) and userID = ? `;
    const [result] = await connectionAsync.query(sqlCheck, [userId]);
   
   
    if (![result]) {
      res.render('record', { message: "User has Already Slept" });   
    }
    // Get user SleepTime And Duration
    const duration = await calculateDuration(sleep, wake);

    if (duration <= 0) {
      return  res.render('record', { message: "Invalid Wakeup Time" });   

     // res.status(403).json({
      //  status: "Fail",
        //message: "Invalid WakeUp Time."
      //});
    }
    //console.log(`Sleep Duration : ${duration}`);
    const sqlAdd = " insert into sleep (userID, sleepTime, wakeupTime, duration) values (?,?,?,?)";
    const time = String(duration);
    var insertedData = {sleep, wake,time};
    await connectionAsync.query(sqlAdd, [userId, sleep, wake, time]);
    console.log(insertedData);
   
    return res.redirect("/profile");
  
  } catch (err) {
    console.error(err);
  }
};

       /////\\\\\ UPDATE  ENTRY \\\\////
exports.updateEntry = async function (req, res, next) {
  
  try {
    const sleep = req.body.sleepTime;
    const wake = req.body.wakeupTime;

    console.log(sleep,wake);
    const userId = req.user;

     // check the Existence of Entry the same SleepTime  and userId
    const sqlCheck = `select * from sleep where sleepTime = cast ('${sleep}' As DateTime) and  userID = ? `;
    console.log(sqlCheck);
    const [result] = await connectionAsync.query(sqlCheck, [userId]);
    //console.log(result);
    if (result == undefined) {
      return res.render('updateFile', {
        message: 'Entry Does not Exit. Try To Add Entry Fist'
      });
    }

    const id = result.id;
    console.log(`ENTRY ID : ${id}`);
    const duration = await calculateDuration(sleep, wake);
     if (duration <= 0) {
      return  res.render('updateFile', { message: "Invalid Wakeup Time" });   

     // res.status(403).json({
      //  status: "Fail",
        //message: "Invalid WakeUp Time."
      //});
    }
    console.log(duration);

      const time = String(duration);
      var updatedData = {sleep, wake,time};
     
    console.log(time);
    
    const sqlUpdate = "update sleep set  sleepTime = ?, wakeupTime= ?, duration= ?  where id=?";
  
    await connectionAsync.query(sqlUpdate, [sleep, wake, time, id]);

     return res.redirect('profile',{
        message: 'Entry Updated Successfully'
      });

     //return res.redirect("/profile");
   
  } catch (err) {
    console.error(err);
  }
     
};
              

/////\\\\\ DELETE  ENTRY \\\\////
exports.deleteEntry = async function (req,res,next) {
     
  try {
    
    const sleep = req.body.sleepTime;
    const wake = req.body.wakeupTime;

    const userId = req.user;
    console.log(wake);
    console.log(`USER ID ${userId}`);

    // check if Exists and Have same Sleep , WakeUp  
  
    const sqlCheck = `select * from sleep where sleepTime = cast ('${sleep}' As DateTime) and wakeupTime = cast ('${wake}' As DateTime) and  userID = ?`;
    const [result] = await connectionAsync.query(sqlCheck, [userId]);
    console.log(result);
    if (result == undefined) {

      return res.render('record', {
        message: 'Entry Does not Exit. Try To Add Entry First'
      });
 
    }
    const id = result.id;
    console.log(`ENTRY ID : ${id}`);

    const sqlDelete = "delete from sleep where id = ?";
  
    await connectionAsync.query(sqlDelete, [id]);
    
     return res.redirect('profile',{
        message: 'Entry Deleted Successfully'
      });
  } catch (err) {
    console.error(err);
  }
};
