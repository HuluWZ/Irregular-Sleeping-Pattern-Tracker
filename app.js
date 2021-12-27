const express = require('express');
const bodyParser = require('body-parser');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
//const cookieSession = require('cookie-session');

const app = express();
const path = require('path');
const userRouter = require('./userRoutes');
const htmlRouter = require('./htmlRouter')
const authController = require('./authController');
require('./authSocialController');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// 1) MIDDLEWARES
app.use(express.json());

const publicDirectory = path.join(__dirname, './public')

app.use(express.static(publicDirectory));
app.use(express.static('views/img')); 
app.use(express.urlencoded({ extended: true }));
  // 2)Login MIDDLEWARES
app.use(cookieParser());

//app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
 console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});


app.get('/api/google', passport.authenticate('google',
  {scope: ['profile', 'email'] }));

app.get('/api/login/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/failed'
  }),
  function(req, res) {
    // Successful authentication, 
    // Redirect to profile page.
    res.redirect('/profile');
  }
);

// 3) ROUTES
// Auth Routes

app.get('/logout', (req, res) => {
    req.session = null;
    authController.logout();
    res.redirect('/');
})

app.use(htmlRouter)
 //
app.use('/api/user', userRouter);

module.exports = app;
