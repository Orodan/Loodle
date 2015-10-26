var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var Vote = require('../models/vote.model');

var NotificationController = require('./notification');

var VoteController = {};

var defaultValue = 0;

VoteController.createVotesForSchedule = function (loodle_id, schedule_id, callback) {

	// Get the user ids
	Vote.getUserIdsOfLoodle(loodle_id, function (err, user_ids) {
		if (err)
			return callback(err);

		// For each of them
		async.each(user_ids, function (user_id, done) {

			// Create a new default vote
			var vote = new Vote(defaultValue);
			async.parallel({
				// Save the vote
				save: function (end) {
					vote.save(end);
				},
				// Bind the vote to a loodle, schedule and user
				bind: function (end) {
					vote.bind(loodle_id, user_id, schedule_id, end)
				}
			}, done);

		}, callback);
	});

};

/**
VoteController.updateVotes = function (loodle_id, user_id, votes, callback) {

	async.parallel({
		updateVotes: function (done) {
			async.each(votes, function(vote, end) {
				Vote.update(vote.id, vote.vote, end);
			}, done);
		},
		notify: function (done) {
			NotificationController.notify(loodle_id, user_id, done);
		}
	}, callback);

};
**/
VoteController.updateVotes = function (req, res) {

	var user_id;

	// Authenticated mode
	if (req.user) 
		user_id = req.user.id;
	// Non authenticated mode
	else
		user_id = req.body.user_id;

	// Update the votes
	// Send the notifications
	
	async.parallel({
		updateVotes: function (done) {
			async.each(req.body.votes, function(vote, end) {
				Vote.update(vote.id, vote.vote, end);
			}, done);
		},
		notify: function (done) {
			NotificationController.notify(req.params.id, user_id, done);
		}
	}, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'Vote(s) updated');
	});


};

VoteController.deleteVotesFromSchedule = function (loodle_id, schedule_id, callback) {

	// Get vote ids of the schedule
	// Delete the votes
	// Delete the association doodle-schedule-vote
	// Get user ids of the loodle
	// For each of them, delete the association doodle-user-vote

	async.series([
		function (done) {

			async.waterfall([
				// Get vote ids of the schedule
				function (end) {
					Vote.getVoteIdsFromSchedule(loodle_id, schedule_id, end);
				},
				// Delete the votes
				function (vote_ids, end) {
					async.each(vote_ids, function (vote_id, finish) {
						Vote.remove(vote_id, finish);
					}, end);
				}
			], done);

		},
		function (done) {
			Vote.deleteAssociationScheduleVoteBySchedule(loodle_id, schedule_id, done);
		},
		function (done) {

			async.waterfall([
				// Get user ids of the loodle
				function (end) {
					Vote.getUserIdsOfLoodle(loodle_id, end);
				},
				// For each of them, delete the association doodle-user-vote
				function (user_ids, end) {
					async.each(user_ids, function (user_id, finish) {
						Vote.deleteAssociationUserVoteBySchedule(loodle_id, user_id, schedule_id, finish);
					}, end);
				}
			], done);

		}
	], callback);
};

VoteController.deleteVotesFromUser = function (loodle_id, user_id, callback) {

	// Get the vote ids of the user in this loodle
	// Delete the votes

	// Delete the association loodle - user - vote

	// Get the schedule ids of the loodle
	// For each of them, delete the association loodle - schedule - vote

	async.series([

		function (done) {

			async.waterfall([
				// Get vote ids
				function (end) {
					Vote.getVoteIdsFromUser(loodle_id, user_id, end);
				},
				// Delete the votes
				function (vote_ids, end) {
					async.each(vote_ids, function (vote_id, finish) {
						Vote.remove(vote_id, finish);
					}, end);
				}
			], done);

		},

		// Delete the association loodle - user - vote
		function (done) {
			Vote.deleteAssociationUserVoteByUser(loodle_id, user_id, done);
		},

		function (done) {

			async.waterfall([
				// Get schedule ids of the loodle
				function (end) {
					Vote.getScheduleIdsOfLoodle(loodle_id, end)
				},
				// For each of them, delete the association loodle - schedule - vote
				function (schedule_ids, end) {
					async.each(schedule_ids, function (schedule_id, finish) {
						Vote.deleteAssociationScheduleVoteByUser(loodle_id, schedule_id, user_id, finish);
					}, end);
				}
			], done);

		}

	], callback);

};

VoteController.createDefaultVotesForLoodle = function (loodle_id, user_id, callback) {

	// Get schedule ids of the loodle
	// For each of them
	// Create a default vote

	async.waterfall([

		// Get schedule ids of the loodle
		function (done) {
			Vote.getScheduleIdsOfLoodle(loodle_id, done);
		},

		// For each of them create a default vote
		function (schedule_ids, done) {

			console.log("Schedule_ids : ", schedule_ids);

			async.each(schedule_ids, function (schedule_id, end) {

				console.log("Schedule id : ", schedule_id);

				// Create a new default vote
				var vote = new Vote(defaultValue);
				async.parallel({
					// Save the vote
					save: function (finish) {
						vote.save(finish);
					},
					// Bind the vote to a loodle, schedule and user
					bind: function (finish) {
						vote.bind(loodle_id, user_id, schedule_id, finish)
					}
				}, end);

			}, done);

		}
	], callback);

};

module.exports = VoteController;

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