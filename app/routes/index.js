var express = require('express');
var router = express.Router();

var Loodle = require('../controllers/loodle');

var jwt = require('express-jwt');
var secret = require('../../config/secret');

router.use(jwt({ 
    secret: secret
  }).unless({ 
    path : ['/sign-up', '/login', '/logout'] 
  }));

router.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
  	res.redirect('/login');
  }
});

// Index page =========================================
router.get('/', function(req, res) {
	res.render('index');
});

// Login page =========================================
router.get('/login', function (req, res) {
	res.render('login');
});

// Signup page ========================================
router.get('/sign-up', function (req, res) {
	res.render('sign-up');
});

// Logout page ========================================
router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/login');
});

module.exports = router;
