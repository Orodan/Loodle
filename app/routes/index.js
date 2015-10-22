var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../controllers/user');
var Vote = require('../controllers/vote');
var Loodle = require('../controllers/loodle');
var Schedule = require('../controllers/schedule');
var ParticipationRequest = require('../controllers/participation-request');
var Configuration = require('../controllers/configuration');

// GET =====================================================

// PAGES ===================

// Home 
router.get('/', isAuthenticated, function(req, res, next) {
	res.render('index', {
		message: req.flash()
	});
});

// Login
router.get('/login', function (req, res) {
	res.render('login', {
		message: req.flash()
	});
});

// Sign up 
router.get('/sign-up', function (req, res) {
	res.render('sign-up', {
		message: req.flash()
	});
});

// Logout
router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/login');
});

// New loodle
router.get('/new-doodle', isAuthenticated, function (req, res) {
	res.render('new-doodle');
});

// Loodle page
router.get('/loodle/:id', isAuthenticated, function (req, res) {
	res.render('loodle', {
		message: req.flash()
	});
});

// Add schedule page
router.get('/loodle/:id/schedule/add', isAuthenticated, function (req, res) {
	res.render('add-schedule');
});

// Add user page
router.get('/loodle/:id/user/add', isAuthenticated, function (req, res) {
	res.render('add-user');
});

// Delete schedule page
router.get('/loodle/:id/schedule/delete', isAuthenticated, function (req, res) {
	res.render('delete-schedule');
});

// Delete user page
router.get('/loodle/:id/user/delete', isAuthenticated, function (req, res) {
	res.render('delete-user');
});

// Configuration page
router.get('/loodle/:id/configure', isAuthenticated, function (req, res) {
	res.render('configure');
});

// Accept participation request
router.get('/participation-request/:id/accept', isAuthenticated, function (req, res) {

	ParticipationRequest.accept(req.params.id, req.user.id, function (err, data) {
		if (err)
			throw new Error(err);

		res.redirect('/');
	});

});

// DATA ======================

// Get user data
router.get('/data/user', isAuthenticated, function (req, res) {
	User.get(req.user.id, function (err, user) {
		if (err)
			throw new Error(err);

		res.json({
			type: true,
			data: user
		});
	})
});

// Get loodle data
router.get('/data/loodle/:id', isAuthenticated, Loodle.get);

// Loodles list data
router.get('/data/loodle/', isAuthenticated, Loodle.getLoodlesOfUser);

// Participation requests data of loodle
router.get('/data/loodle/:id/participation-request', isAuthenticated, ParticipationRequest.getParticipationRequestsOfLoodle);

// Participation requests data of user
router.get('/data/participation-request/', isAuthenticated, ParticipationRequest.getParticipationRequestsOfUser);

// Configuration of the user for the specified loodle
router.get('/data/loodle/:id/configuration', isAuthenticated, Configuration.get);

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

// Process new doodle
router.post('/new-doodle', isAuthenticated, function (req, res) {
	
	Loodle.createLoodle(req.user.id, req.body.name, req.body.description, function (err, data) {
		if (err) 
			throw err;

		res.redirect('/loodle/' + data.id);
	})
});

// Process add schedule
router.post('/loodle/:id/schedule/add', isAuthenticated, function (req, res) {

	// Create the schedule
	// Bind it to the loodle
	// Create the default votes according to the schedule
	
	Schedule.createSchedule(req.params.id, req.body.begin_time, req.body.end_time, function (err, data) {
		if (err)
			throw new Error(err);
		
		req.flash('success', 'Schedule added');
		res.redirect('/loodle/' + req.params.id);

	});
	
});

// Process add user
router.post('/loodle/:id/user/add', isAuthenticated, function (req, res) {

	// Create the participation request
	// Bind it to the loodle and the concerned user

	ParticipationRequest.createParticipationRequest(req.params.id, req.user.id, req.body.email, function (err, data) {
		if (err)
			throw new Error(err);

		req.flash('success', 'Participation request send');
		res.redirect('/loodle/' + req.params.id);
	});

});

// Process delete schedule
router.post('/loodle/:id/schedule/delete', isAuthenticated, function (req, res) {

	Schedule.remove(req.params.id, req.body.schedule_id, function (err) {
		if (err)
			throw new Error(err);

		req.flash('success', 'Schedule deleted');
		res.redirect('/loodle/' + req.params.id);
	});

});

// Process delete user
router.post('/loodle/:id/user/delete', isAuthenticated, function (req, res) {

	User.remove(req.params.id, req.body.user_id, function (err) {

		if (err)
			throw new Error(err);

		req.flash('success', 'User deleted');
		res.redirect('/loodle/' + req.params.id);

	});

});

// PUT =====================================================

router.put('/loodle/:id/votes', function (req, res) {

	Vote.updateVotes(req.params.id, req.user.id, req.body.votes, function (err) {

		if (err)
			throw new Error;

		res.json({
			type: true,
			data: "votes updated"
		});
	});

});

router.put('/data/loodle/:id/configuration', Configuration.update);


// DEL =====================================================

router.delete('/loodle/:id', function (req, res) {

	Loodle.remove(req.params.id, function (err) {
		if (err)
			throw new Error(err);

		res.json({
			type: true,
			data: 'Loodle deleted'
		});
	})

});

function isAuthenticated (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login');
}

module.exports = router;
