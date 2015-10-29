var async                = require('async');
var bcrypt               = require('bcrypt-nodejs');
var ParticipationRequest = require('../models/participation-request.model');

var Configuration        = require('./configuration');

var ParticipationRequestController = {};

ParticipationRequestController.getParticipationRequestsOfUser = function (req, res) {

	async.waterfall([
		// Get participation requests ids of the user
		function (done) {
			ParticipationRequest.getIdsFromUser(req.user.id, done);
		},
		// Get participation requests data
		function (participation_request_ids, done) {

			var results = [];

			async.each(participation_request_ids, function (pr_id, end) {
				ParticipationRequest.get(pr_id, function (err, data) {
					if (err)
						return end(err);

					results.push(data);
					return end();
				})
			}, function (err) {
				if (err)
					return done(err);

				return done(null, results);
			});
		},
		// Get data of the loodle and users concerned
		function (participation_requests, done) {

			var results = [];

			async.each(participation_requests, function (participation_request, end) {

				async.parallel({
					fromData: function (finish) {
						ParticipationRequest.getUserData(participation_request.from_id, finish);
					},
					toData: function (finish) {
						ParticipationRequest.getUserData(participation_request.to_id, finish);
					},
					loodleData: function (finish) {
						ParticipationRequest.getLoodleData(participation_request.doodle_id, finish);
					}
				}, function (err, data) {
					if (err) 
						return end(err);

					results.push({
						id: participation_request.id,
						from: data.fromData,
						to: data.toData,
						loodle: data.loodleData
					});

					return end();
				});

			}, function (err) {
				if (err)
					return done(err);

				return done(null, results);
			});

		}
	], function (err, results) {
		if (err)
			return error(res, err);

		return success(res, results);
	});

};

ParticipationRequestController.getParticipationRequestsOfLoodle = function (req, res) {

	// Get participation requests ids from loodle id
	// Get participation requests data
	// Get data of the loodle and users concerned

	async.waterfall([
		// Get participation requests ids from loodle id
		function (done) {
			ParticipationRequest.getIdsFromLoodle(req.params.id, done);
		},
		// Get participation requests data
		function (participation_request_ids, done) {
			var results = [];

			async.each(participation_request_ids, function (pr_id, end) {
				ParticipationRequest.get(pr_id, function (err, data) {
					if (err)
						return end(err);

					results.push(data);
					return end();
				})
			}, function (err) {
				if (err)
					return done(err);

				return done(null, results);
			});
		},
		// Get data of the loodle and users concerned
		function (participation_requests, done) {

			var results = [];

			async.each(participation_requests, function (participation_request, end) {

				async.parallel({
					fromData: function (finish) {
						ParticipationRequest.getUserData(participation_request.from_id, finish);
					},
					toData: function (finish) {
						ParticipationRequest.getUserData(participation_request.to_id, finish);
					},
					loodleData: function (finish) {
						ParticipationRequest.getLoodleData(participation_request.doodle_id, finish);
					}
				}, function (err, data) {
					if (err) 
						return end(err);

					results.push({
						id: participation_request.id,
						from: data.fromData,
						to: data.toData,
						loodle: data.loodleData
					});

					return end();
				});

			}, function (err) {
				if (err)
					return done(err);

				return done(null, results);
			});

		}
	], function (err, results) {
		if (err)
			return error(res, err);

		return success(res, results);
	});

};

ParticipationRequestController.createParticipationRequest = function (loodle_id, from_id, to_email, callback) {

	// Get the id of the user to send the participation requests
	ParticipationRequest.getUserIdFromEmail(to_email, function (err, to_id) {

		if (err)
			return callback(err);

		// Create the participation request
		var pr = new ParticipationRequest(loodle_id, from_id, to_id);

		async.parallel({
			// Save the participation request
			save: function (done) {
				pr.save(done);
			},
			// Bind it to the loodle
			bindToLoodle: function (done) {
				ParticipationRequest.bindToLoodle(pr.id, loodle_id, done);
			},
			// Bind it to the user
			bindToUser: function (done) {
				ParticipationRequest.bindToUser(pr.id, to_id, done);	
			}
		}, function (err, result) {
			if (err)
				return callback(err);

			return callback(null, result.save);
		});

	});

};

ParticipationRequestController.accept = function (participation_request_id, user_id, callback) {

	// Get the loodle id from the participation request data
	ParticipationRequest.get(participation_request_id, function (err, data) {

		if (err)
			return callback(err);

		var loodle_id = data.doodle_id;

		async.parallel({

			// Give access to the concerned loodle
			loodleAccess: function (done) {
				ParticipationRequest.giveAcess(user_id, loodle_id, done);
			},

			// Create default votes for each schedule of the loodle
			defaultVotes: function (done) {

				async.waterfall([
					// Get schedule ids of the loodle
					function (end) {
						ParticipationRequest.getScheduleIds(loodle_id, end);
					},
					// Create a default vote for each of them
					function (schedule_ids, end) {

						async.each(schedule_ids, function (schedule_id, finish) {

							ParticipationRequest.createDefaultVote(loodle_id, user_id, schedule_id, finish);

						}, end);

					}
				], done);
			},

			// Create default configuration for the user
			createDefaultConfiguration: function (done) {
				Configuration.createDefaultConfiguration(user_id, loodle_id, done);
			},

			// Delete the participation request
			deleteParticipationRequest: function (done) {
				ParticipationRequest.remove(participation_request_id, loodle_id, user_id, done);
			}
		}, callback);

	});

};

ParticipationRequestController.decline = function (participation_request_id, user_id, callback) {

	ParticipationRequest.get(participation_request_id, function (err, data) {

		if (err)
			return callback(err);

		var loodle_id = data.doodle_id;

		ParticipationRequest.remove(participation_request_id, loodle_id, user_id, callback);

	});

};

module.exports = ParticipationRequestController;

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