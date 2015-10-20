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

module.exports = VoteController;