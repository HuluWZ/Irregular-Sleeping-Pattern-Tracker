const passport = require('passport');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const GoogleStrategy = require('passport-google-oauth2').Strategy;




passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'http://localhost:3000/api/login/google/callback',
    passReqToCallback:true
},
  
function(request,accessToken,refreshToken,profile,done){
    console.log(profile);
       return done(null,profile);
  }));

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});
