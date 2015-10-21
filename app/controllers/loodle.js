var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var Loodle = require('../models/loodle.model');

var LoodleController = {};

LoodleController.createLoodle = function (user_id, name, description, callback) {

	var loodle = new Loodle(name, description);
	async.parallel({
		// Save the loodle
		save: function (done) {
			loodle.save(done);
		},
		// Associate the loodle and the user
		bind: function (done) {
			Loodle.bindUser(user_id, loodle.id, done)
		}
	}, function (err, results) {

		if (err)
			return callback(err)
		
		return callback(null, results.save);

	});

};

LoodleController.getResume = function (req, res) {

	Loodle.get(req.params.id, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

LoodleController.getUsers = function (req, res) {

	Loodle.getUsers(req.params.id, function (err, data) {
		if (err)
			return error(res, error);

		return success(res, data);
	});

};

LoodleController.getVotes = function (req, res) {

	Loodle.getVotes(req.params.id, function (err, data) {
		if (err)
			return error(res, error);

		return success(res, data);
	});

};

LoodleController.getSchedules = function (req, res) {

	Loodle.getSchedules(req.params.id, function (err, data) {

		if (err)
			return error(res, error);

		return success(res, data);
	});

};

LoodleController.get = function (req, res) {

	async.parallel({

		// Get loodle data
		loodle: function (done) {
			Loodle.get(req.params.id, done);
		},
		// Get users of the loodle
		users: function (done) {
			Loodle.getUsers(req.params.id, done);
		},
		// Get schedules of the loodle
		schedules: function (done) {
			Loodle.getSchedules(req.params.id, done);
		},
		// Get votes of the loodle
		votes: function (done) {
			Loodle.getVotes(req.params.id, done);
		}

	}, function (err, results) {

		if (results.loodle === undefined) {
			return error(res, 'This loodle does not exists');
		} 

		// Format
		results.loodle.schedules = results.schedules;
		results.loodle.votes = results.votes;
		results.loodle.users = results.users;

		if (err)
			return error(res, err);

		return success(res, results.loodle);
	});

};

LoodleController.getLoodlesOfUser = function (req, res) {

	async.waterfall([
		// Get the loodles id 
		function (done) {
			Loodle.getLoodleIdsOfUser(req.user.id, done);
		},
		// Get the loodles data 
		function (loodle_ids, done) {
			var results = [];

			async.eachSeries(loodle_ids, function (loodle_id, end) {

				Loodle.get(loodle_id, function (err, data) {
					if (err)
						return end(err);

					results.push(data);
					return end();
				})
			}, function (err) {
				return done(err, results);
			});
		}
	], function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

LoodleController.remove = function (loodle_id, callback) {

	// Delete the loodle

	// Get the schedule ids associated with the loodle
	// Delete the schedules
	// Delete the association loodle - schedule

	// Get the user ids associated with the loodle
	// Delete the association loodle - user

	// Get the vote ids associated with the loodle
	// Delete the votes
	// Delete the association loodle - vote

	// Get the participation request ids associated with the loodle
	// Delete the participation requests
	// Get the user ids who have a participation requests
	// Delete the association user - participation request
	// Delete the association loodle - participation request

	async.series({

		// Delete the loodle
		deleteLoodle: function (done) {
			Loodle.remove(loodle_id, done);
		},

		// Delete schedules
		deleteSchedules: function (done) {

			async.waterfall([

				// Get the schedule ids associated with the loodle
				function (end) {
					Loodle.getScheduleIds(loodle_id, end);
				},

				// Delete the schedules
				function (schedule_ids, end) {

					async.each(schedule_ids, function (schedule_id, finish) {
						Loodle.removeSchedule(schedule_id, finish);
					}, end);

				},

				// Delete the association loodle - schedule
				function (end) {
					Loodle.removeAssociationLoodleSchedules(loodle_id, end);
				}
			], done);

		},

		// Delete user association 
		deleteUserAssociation: function (done) {

			async.waterfall([

				// Get the user ids associated with the loodle
				function (end) {
					Loodle.getUserIds(loodle_id, end);
				},

				// Delete the association loodle - user
				function (user_ids, end) {

					async.each(user_ids, function (user_id, finish) {
						Loodle.removeAssociationLoodleUser(loodle_id, user_id, finish);
					}, end);

				}

			], done);

		},

		// Delete votes
		deleteVotes: function (done) {

			async.waterfall([

				// Get the vote ids associated with the loodle
				function (end) {
					Loodle.getVoteIds(loodle_id, end);
				},

				// Delete the votes
				function (vote_ids, end) {

					async.each(vote_ids, function (vote_id, finish) {
						Loodle.removeVote(vote_id, finish);
					}, end);

				},

				// Delete the association loodle - vote
				function (end) {
					Loodle.removeAssociationLoodleVote(loodle_id, end);
				},



			], done);

		},

		// Delete participation requests
		deleteParticipationRequests: function (done) {

			var participation_request_ids = [];
			var user_ids = [];

			async.series([

				// Get the participation request ids associated with the loodle
				function (end) {
					Loodle.getParticipationRequestIds(loodle_id, function (err, data) {
						if (err)
							return end(err);

						participation_request_ids = data;
						return end();
					});
				},

				// Get the user ids who have a participation requests
				function (end) {

					async.each(participation_request_ids, function (pr_id, finish) {

						Loodle.getUserIdWithParticipationRequest(pr_id, function (err, user_id) {
							if (err)
								return finish(err);

							user_ids.push(user_id);
							return finish();
						});

					}, function (err) {
						if (err)
							return end(err);

						return end(null, user_ids);
					});

				},

				// Delete the association user - participation request
				function (end) {

					async.each(user_ids, function (user_id, finish) {

						Loodle.removeAssocationUserParticipationRequest(user_id, finish);

					}, end);

				},

				// Delete the association loodle - participation request
				function (end) {
					Loodle.removeAssociationLoodleParticipationRequest(loodle_id, end);
				},


				// Delete the participation requests
				function (end) {
					
					async.each(participation_request_ids, function (pr_id, finish) {

						Loodle.removeParticipationRequest(pr_id, finish);

					}, function (err) {
						if (err)
							return end(err);

						return end(null, participation_request_ids);
					});

				},

			], done);

		}
	}, callback);

};


module.exports = LoodleController;

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