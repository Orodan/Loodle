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

var Config               = require('../../config/config.js');

// All the api routes need an acces token, except the route
// to get the token
router.use(jwt({ secret: Config.jwt_secret}).unless({path: ['/api/authenticate']}));
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


// POST ============================================================

// Authenticate ========================================
router.post('/authenticate', function (req, res) {
	User.authenticate(req.body.email, req.body.password, function (err, data) {
		if (err) {
			res.status(500);
		}

		return res.json({
			"data": data
		});
	});
});

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

router.put('/loodle/:id/votes', function (req, res) {

	Vote.updateVotes(req.params.id, req.user.id, req.body.votes, function (err) {

		if (err)
			return error(res, err);

		return error(res, 'votes updated');
	});

});

router.put('/loodle/:id/configuration', Configuration.update);

router.put('/notification/:id', Notification.markAsRead);

// DELETE ==========================================

// Delete a schedule
router.delete('/loodle/:id/schedule', function (req, res) {

	Schedule.remove(req.params.id, req.body.schedule_id, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'Schedule deleted');
	});

});

// Remove an user from a loodle
router.delete('/loodle/:id/user', function (req, res) {

	User.remove(req.params.id, req.body.user_id, function (err, data) {
		if (err)
			res.status(500);

		return res.json({
			"data": data
		});
	});

});

router.delete('/loodle/:id/user', User.remove);

router.delete('/loodle/:id', function (req, res) {

	Loodle.remove(req.params.id, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'Loodle deleted');
	})

});

function test (req, res, data) {
	console.log('Data : ', data);
}

router.use(function (req, res) {

	console.log('Data : ', data);
	// console.log('Status : ', status);
	console.log('res.status : ', res.status);

	if (status)
		res.status(status);

	res.json({
		"data": data
	});
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