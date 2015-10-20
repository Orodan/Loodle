var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var Vote = require('../models/vote.model');

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

VoteController.updateVotes = function (votes, callback) {

	async.each(votes, function(vote, done) {

		Vote.update(vote.id, vote.vote, done);

	}, callback);

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

module.exports = VoteController;