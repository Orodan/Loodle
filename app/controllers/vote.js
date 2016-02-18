var async                  = require('async');
var bcrypt                 = require('bcrypt-nodejs');
var Vote                   = require('../models/vote.model');

var NotificationController = require('./notification');
var Loodle                 = require('../models/loodle.model');

var Validator 			   = require('../../util/validator');

var VoteController = {};

var defaultValue = 0;

/////////////////
// Routes call //
/////////////////

/**
 * Route call use to update votes
 * 
 * @param  {Object} req 	Incomming request
 * @param  {Object} res 	Response to send
 */
VoteController._updateVotes = function (req, res) {

	var userId;

	if (req.user)
		userId = req.user.id;
	else
		userId = req.body.user_id;

	VoteController.updateVotes(req.params.id, userId, req.body, function (err, result) {
		if (err) return error(res, err.message);

		return success(res, 'Vote(s) updated');
	});

};


/////////////////////////////
// Vote controller feature //
/////////////////////////////

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

/**
 * Create a default vote the user on the loodle and about the schedule
 * 
 * @param  {String}   loodle_id   	Loodle identifier
 * @param  {String}   user_id     	User identifier
 * @param  {String}   schedule_id 	Schedule identifier
 * @param  {Function} callback    	Standard callback function
 */
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

/**
 * Create default votes about the schedule, for all the users of the loodle
 * 
 * @param  {String}   loodle_id   	Loodle identifier
 * @param  {String}   schedule_id 	Schedule identifier
 * @param  {Function} callback    	Standard callback function
 */
VoteController.createDefaultVotesForSchedule = function (loodle_id, schedule_id, callback) {

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
 * Update the loodle's votes of the user
 * 
 * @param  {String}   	loodleId 		Loodle identifier
 * @param  {String}   	userId   		User identifier
 * @param  {Array}   	votes    		Vote's array
 * @param  {Function} 	callback 		Standard callback function
 */
VoteController.updateVotes = function (loodleId, userId, votes, callback) {

	// Check if the vote value are all 0 or 1
	async.series({

		// Validate the loodle id is known
		loodleIdIsKnown: function (end) {

			Validator.loodle.knownId(loodleId, function (err, result) {
				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('Unknown loodle id'));

				return end();
			});

		},

		// Validate the user id is known
		userIdIsKnown: function (end) {

			Validator.user.knownId(userId, function (err, result) {
				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('Unknown user id'));

				return end();
			});

		},

		// Validate the vote ids are known
		voteIdsAreKnown: function (end) {

			async.each(votes, function (vote, done) {
				Validator.vote.knownId(vote.id, function (err, result) {
					if (err) return done(err);

					if (!result)
						return done(new ReferenceError('Unknown vote id'));

					return done();
				});
			}, end);

		},

		// Check if the votes value are all 0 or 1
		checkVoteValueRange: function (end) {

			async.each(votes, function (vote, done) {
				if (!Validator.vote.isInRange(vote.vote))
					return done(new RangeError('Vote value should be 0 or 1'));

				return done();
			}, end);

		},

		// Update votes
		updateVotes: function (end) {

			async.parallel({
				updateVotes: function (done) {
					async.each(votes, function(vote, end) {
						Vote.update(vote.id, vote.vote, end);
					}, done);
				},
				notify: function (done) {
					NotificationController.notify(loodleId, userId, done);
				}
			}, end);

		}


	}, function (err) {
		if (err) return callback(err);

		return callback(null, 'Vote(s) updated');
	});

};

/**
 * Delete votes associated with the loodle id and the schedule id
 * 
 * @param  {String}   loodle_id   	Loodle identifier
 * @param  {String}   schedule_id 	Schedule identifier
 * @param  {Function} callback    	Standard callback function
 */
VoteController.deleteVotesFromSchedule = function (loodle_id, schedule_id, callback) {

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

/**
 * Delete votes associated with the loodle id and the user id
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {String}   user_id   	User identifier
 * @param  {Function} callback  	Standard callback function
 */
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

/**
 * Create default votes for a new user in the loodle
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {String}   user_id   	User identifier
 * @param  {Function} callback  	Standard callback function
 */
VoteController.createDefaultVotesForLoodle = function (loodle_id, user_id, callback) {

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
        data: err
    });
};

function success(res, data) {
    res.json({
        type: true,
        data: data
    });
};