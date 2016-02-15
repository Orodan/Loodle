var express              = require('express');
var router               = express.Router();
var passport             = require('passport');
var jwt                  = require('express-jwt');

var User                 = require('../controllers/user');
var Loodle               = require('../controllers/loodle');
var Schedule             = require('../controllers/schedule');
var ParticipationRequest = require('../controllers/participation-request');
var Configuration        = require('../controllers/configuration');
var Notification         = require('../controllers/notification');
var Vote                 = require('../controllers/vote');

var Config               = require('../../config/config.js');

// All the api routes need an acces token, except the route to get the token
router.use(jwt({ secret: Config.jwt_secret }).unless({path: ['/api/authenticate', {url: '/api/user', methods: 'POST'}]}));
router.use(function (err, req, res, next) {

  if (err.name === 'UnauthorizedError') {
    res.status(401);
    return res.json('Unauthorized');
  }

});

// GET ==========================================================================================

router.get('/user', User._get);

router.get('/user/participation-requests', ParticipationRequest.getParticipationRequestsOfUser);

router.get('/loodle/:id', Loodle._get);

router.get('/loodle/resume/:id', Loodle.getResume);

router.get('/loodle/', Loodle.getLoodlesOfUser);

router.get('/loodle/getUsers/:id', Loodle.getUsers);

router.get('/loodle/getSchedules/:id', Loodle.getSchedules);

router.get('/loodle/getVotes/:id', Loodle.getVotes);

router.get('/loodle/:id/participation-request', ParticipationRequest.getParticipationRequestsOfLoodle);

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

router.get('/loodle/:id/configuration', Configuration.get);

router.get('/loodle/:id/notifications', Notification.getFromUser);

router.get('/user/getLoodles', function (req, res) {

	User.getLoodleIds(req.user.id, function (err, data) {
		if (err) { return error(res, err); }
		return success(res, data);
	});

});


// POST ============================================================

// Authenticate ========================================
router.post('/authenticate', User._authenticate);

// Create a new user ===================================
router.post('/user', User._createUser);

// Create a new loodle =================================
router.post('/loodle', Loodle._createLoodle);

// Add user ============================================
router.post('/loodle/:id/user', Loodle._addUser);

// Add schedule ========================================
router.post('/loodle/:id/schedule', Loodle._addSchedule);

/**
router.post('/loodle/:id/schedule', function (req, res) {

	Schedule.createSchedule(req.params.id, req.body.begin_time, req.body.end_time, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

});
**/

router.post('/loodle/:id/participation-request', function (req, res) {

	ParticipationRequest.createParticipationRequest(req.params.id, req.user.id, req.body.email, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

});

// PUT =============================================

/**
router.put('/loodle/:id/votes', function (req, res) {

	Vote.updateVotes(req.params.id, req.user.id, req.body.votes, function (err) {

		if (err)
			return error(res, err);

		return error(res, 'votes updated');
	});

});
**/
router.put('/loodle/:id/votes', Vote._updateVotes);

router.put('/loodle/:id/configuration', Configuration.update);

router.put('/notification/:id', Notification.markAsRead);

// DELETE ==========================================

// Remove an user from a loodle
router.delete('/loodle/:id/user', Loodle._removeUser);

// Delete a schedule
router.delete('/loodle/:loodleId/schedule/:scheduleId', Loodle._deleteSchedule);

// router.delete('/loodle/:id/user', User.remove);

router.delete('/loodle/:id', function (req, res) {

	Loodle.delete(req.params.id, function (err) {

		if (err)
			return error(res, err);

		return success(res, 'Loodle deleted');
	})

});

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