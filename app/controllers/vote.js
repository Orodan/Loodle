var async                  = require('async');
var bcrypt                 = require('bcrypt-nodejs');
var Vote                   = require('../models/vote.model');

var NotificationController = require('./notification');
var Loodle                 = require('../models/loodle.model');

var VoteController = {};

var defaultValue = 0;

/**
 * Delete a vote
 * 
 * @param  {uuid}   	vote_id  		vote identifier
 * @param  {Function} 	callback 		standard callback function
 * 
 * @return {void}            			null or error message
 */
VoteController.delete = function (vote_id, callback) {
	Vote.delete(vote_id, callback);
};

/**
 * Remove associations between the user and the votes she/he has on the loodle
 * 
 * @param  {uuid}   	loodle_id 		loodle identifier
 * @param  {uuid}   	user_id   		user identifier
 * @param  {Function} 	callback  		standard callback function
 * 
 * @return {void}             			null or error message
 */
VoteController.removeAssociationsByUser = function (loodle_id, user_id, callback) {

	// Remove association loodle user
	// Get schedule ids of the loodle
	// Remove association loodle schedule

	async.parallel({

		// Remove associations loodle - user
		removeAssociationsWithUser: function (done) {
			Vote.removeAssociationsWithUser(loodle_id, user_id, done);
		},

		// Remove associations loodle - schedule
		removeAssociationWithSchedule: function (done) {
			async.waterfall([

				// Get schedule ids of the loodle
				function (end) {
					Loodle.getScheduleIds(loodle_id, end);
				},

				// Remove association loodle schedule
				function (schedule_ids, end) {
					async.each(schedule_ids, function (schedule_id, finish) {
						Vote.removeAssociationWithScheduleByUser(loodle_id, schedule_id, user_id, finish);
					}, end);
				}

			], done);
		}

	}, callback);

};

/**
 * Remove associations between the schedule and its votes on the loodle
 * 
 * @param  {uuid}   	loodle_id 		loodle identifier
 * @param  {uuid}   	schedule_id 	schedule identifier
 * @param  {Function} 	callback  		standard callback function
 * 
 * @return {void}             			null or error message
 */
VoteController.removeAssociationsBySchedule = function (loodle_id, schedule_id, callback) {

	// Remove association loodle schedule
	// Get user ids of the loodle
	// Remove association loodle user

	async.parallel({

		// Remove associations loodle - schedule
		removeAssociationsWithSchedule: function (done) {
			Vote.removeAssociationsWithSchedule(loodle_id, schedule_id, done);
		},

		// Remove association loodle - user
		removeAssociationsWithUser: function (done) {
			async.waterfall([

				// Get user ids of the loodle
				function (end) {
					Loodle.getUserIds(loodle_id, end);
				},

				// Remove association loodle user
				function (user_ids,end) {
					async.each(user_ids, function (user_id, finish) {
						Vote.removeAssociationWithUserBySchedule(loodle_id, user_id, schedule_id, finish);
					}, end);
				}
				
			], done);
		}

	}, callback);

};

/**
 * Create default votes for the user on all the schedules of the loodle
 * 
 * @param  {uuid}   	loodle_id 		loodle identifier
 * @param  {uuid}   	user_id   		user identifier
 * @param  {Function} 	callback  		standard callback function
 * 
 * @return {void}             			null or error message
 */
VoteController.createDefaultVotesForUser = function (loodle_id, user_id, callback) {

	async.waterfall([
		// Get schedule ids
		function (done) {
			Vote.getScheduleIds(loodle_id, done);
		},
		// Create default vote for each schedule
		function (schedule_ids, done) {
			async.each(schedule_ids, function (schedule_id, finish) {
				VoteController.createDefaultVote(loodle_id, user_id, schedule_id, finish);
			}, done);
		}
	], callback);

};

VoteController.createDefaultVote = function (loodle_id, user_id, schedule_id, callback) {

	var vote = new Vote();

	async.parallel({
		// Save the vote
		save: function (done) {
			vote.save(done);
		},
		// Associate vote, loodle, user and schedule
		bind: function (done) {
			vote.bind(loodle_id, user_id, schedule_id, done);
		}
	}, callback);

};

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
			async.forEachOf(req.body, function(value, key, end) {
				Vote.update(key, value, end);
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
					Vote.getScheduleIds(loodle_id, end)
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
			Vote.getScheduleIds(loodle_id, done);
		},

		// For each of them create a default vote
		function (schedule_ids, done) {

			async.each(schedule_ids, function (schedule_id, end) {

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