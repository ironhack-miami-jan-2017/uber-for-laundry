var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/user.js');


dotenv.config();
mongoose.connect(process.env.MONGODB_URI);


var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main-layout');
app.use(expressLayouts);
app.locals.title = 'Uber for Laundry';

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'uber for laundry and stuff pls',
  resave: true,
  saveUninitialized: true
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

    // <input type="email" name="email" id="email-input">
    //                             |
    //                     ---------
    //                     |
    // { usernameField: 'email' },
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, next) => {
    User.findOne({ email: email }, (err, user) => {
      if (err) {
        next(err);
      } else if (!user) {
        next(null, false, { message: "Incorrect email" });
      } else if (!bcrypt.compareSync(password, user.password)) {
        next(null, false, { message: "Incorrect password" });
      } else {
        next(null, user);
      }
    });
  }
));

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findOne({ "_id": id }, (err, user) => {
    if (err) {
      cb(err);
      return;
    }
    cb(null, user);
  });
});


app.use('/', index);
app.use('/users', users);

const authRoutes = require('./routes/auth-routes.js');
app.use('/', authRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
