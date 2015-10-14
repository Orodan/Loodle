var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../controllers/user');
var Loodle = require('../controllers/loodle');

/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next) {
	res.render('index', {
		message: req.flash()
	});
});

// GET =====================================================

// Login
router.get('/login', function (req, res) {
	res.render('login', {
		message: req.flash()
	});
});

// Sign up 
router.get('/sign-up', function (req, res) {
	res.render('sign-up');
});

// Logout **/
router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/login');
});

router.get('/new-doodle', isAuthenticated, function (req, res) {
	res.render('new-doodle');
});

// Loodle
router.get('/loodle/:id', isAuthenticated, function (req, res) {
	res.render('loodle');
});

// Loodles list
router.get('/loodle/', isAuthenticated, Loodle.getLoodlesOfUser);

// POST ====================================================

// Process login 
router.post('/login', passport.authenticate('local-login', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true,
	successFlash: true
}));

// Process sign-up
router.post('/sign-up', passport.authenticate('local-signup', {
	successRedirect: '/',
	failureRedirect: '/sign-up',
	failureFlash: true,
    successFlash: true
}));

router.post('/new-doodle', isAuthenticated, function (req, res) {
	
	Loodle.createLoodle(req.user.id, req.body.name, req.body.description, function (err, data) {
		if (err) 
			throw err

		res.redirect('/loodle/' + data.id);
	})
});


// PUT =====================================================


// DEL =====================================================


function isAuthenticated (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login');
}

module.exports = router;
