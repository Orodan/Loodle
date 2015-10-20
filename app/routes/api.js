var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var User = require('../controllers/user');
var Loodle = require('../controllers/loodle');
var Schedule = require('../controllers/schedule');
var ParticipationRequest = require('../controllers/participation-request');

// All the api routes need an acces token, except the route
// to get the token
router.use(jwt({ secret: 'secret'}).unless({path: ['/api/authenticate']}));
router.use(function (err, req, res, next) {

  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({
      type: false,
      data: 'Unauthorized'
    });
  }
});

// GET =============================================

router.get('/user/participation-requests', ParticipationRequest.getParticipationRequestsOfUser);

router.get('/loodle/:id', Loodle.get);

router.get('/loodle/resume/:id', Loodle.getResume);

router.get('/loodle/', Loodle.getLoodlesOfUser);

router.get('/loodle/getUsers/:id', Loodle.getUsers);

router.get('/loodle/getSchedules/:id', Loodle.getSchedules);

router.get('/loodle/getVotes/:id', Loodle.getVotes);

router.get('/participation-request/:id/accept', function (req, res) {

	ParticipationRequest.accept(req.params.id, req.user.id, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, 'Participation request accepted');
	});

});

router.get('/participation-request/:id/decline', function (req, res) {

	ParticipationRequest.decline(req.params.id, req.user.id, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'Participation request declined');
	});

});


// POST ============================================

router.post('/authenticate', User.authenticate);

router.post('/loodle', function (req, res) {

	Loodle.createLoodle(req.user.id, req.body.name, req.body.description, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

});

router.post('/loodle/:id/schedule', function (req, res) {

	Schedule.createSchedule(req.params.id, req.body.begin_time, req.body.end_time, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

});

router.post('/loodle/:id/participation-request', function (req, res) {

	ParticipationRequest.createParticipationRequest(req.params.id, req.user.id, req.body.email, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

});

// PUT =============================================

// DELETE ==========================================

function error(res, err) {
	res.status(500);
	res.json({
		type: false,
		data: 'An error occured : ' + err
	});
};

function success(res, data) {
	res.json({
		type: true,
		data: data
	});
};

module.exports = router;