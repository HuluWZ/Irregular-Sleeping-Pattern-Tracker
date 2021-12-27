const express = require('express');
const {body,check,validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');

const authController = require('./authController');
const catchAsync = require('./catchAsync');

const router = express.Router();

require('./authSocialController');
  // 1) Signup
//router.post('/api/signup',authController.signup);
   // 2) Login

router.post('/login', authController.login);
router.post('/signup', authController.signup);
// 5) Log out
router.get('/logout',authController.logout);

   // 3). LOGIN  with GOOGLE
   
/*
router.get('/google',
  passport.authenticate('google', {scope: [ 'email', 'profile' ] }
));

router.get('/login/google/callback',
  passport.authenticate( 'google', {
    failureRedirect: '/login'
  })
);
*/

 // 6) Reset & Forget PasswordMatch
router.post('/forgotPassword',authController.forgotPassword);
router.post('/resetPassword',authController.resetPassword);


  // SET SLEEPING ROUTER
router.use(authController.protect);
// Restrict to Render Unless it's User
router.use(authController.restrictTo('user'));

router.post('/addEntry', authController.addEntry);
router.post('/updateEntry', authController.updateEntry);
router.post('/deleteEntry', authController.deleteEntry);
// F
router.get('/sleep', authController.getUserSleepData);
 // FETCH username, id ,email of logged in user
router.get('/userDataDashboard', authController.getUserInfo);




module.exports = router;
