var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next) {
	res.render('index', {
		message: req.flash()
	});
});

/** Login **/
router.get('/login', function (req, res) {
	res.render('login', {
		message: req.flash()
	});
});

/** Process login **/
router.post('/login', passport.authenticate('local-login', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true,
	successFlash: true
}));

/** Sign up **/
router.get('/sign-up', function (req, res) {
	res.render('sign-up');
});

router.post('/sign-up', passport.authenticate('local-signup', {
	successRedirect: '/',
	failureRedirect: '/sign-up',
	failureFlash: true,
    successFlash: true
}));

/** Logout **/
router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/login');
});

/** GET New doodle **/
router.get('/new-doodle', isAuthenticated, function (req, res) {
	res.render('new-doodle');
});

function isAuthenticated (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login');
}

module.exports = router;
