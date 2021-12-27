const router = require('express').Router();


// render index page
router.get('/', (req, res) => {
  res.render('index');
});
//render login page
router.get('/login', (req, res) => {
  res.render('login');
});
// redirect to login Page
router.get('/logout', (req, res) => {
  res.render('login');
})
//render register page
router.get('/register', (req, res) => {
  res.render('register');
});
// render reset & forget Password 
router.get('/forgotPassword', (req, res) => {
  res.render('forgetPassword');
});
router.get('/resetPassword/:token', (req, res) => {
  res.render('resetPassword');
})

//render dashboard page
router.get('/dashboard', (req, res) => {
  res.render('dashboard');
});
//render profile page
router.get('/profile', (req, res) => {
  res.render('profile');

});

router.get('/addEntry', (req,res)=> {
  res.render('record');
})
router.get('/updateEntry', (req, res) => {
  res.render('updateFile');
});
router.get('/deleteEntry', (req, res) => {
  res.render('deleteFile');
});

module.exports = router;