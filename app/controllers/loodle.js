var async                = require('async');
var bcrypt               = require('bcrypt-nodejs');
var Loodle               = require('../models/loodle.model');

var User                 = require('./user');
var ParticipationRequest = require('./participation-request');
var Schedule             = require('./schedule');
var Configuration        = require('./configuration');
var Notification         = require('./notification');
var Vote                 = require('./vote');

var LoodleController = {};

// Route calls ========================================================

// Add a new schedule to a loodle
LoodleController._addSchedule = function (req, res) {

	// Check language :
	// if call from the api --> use req.body.language
	// if call from the application --> use req.cookies.mylanguage

	var language;
	if (req.baseUrl === '/api')
		language = req.body.language;
	else
		language = req.cookies.mylanguage;

	LoodleController.addSchedule(req.params.id, req.body.begin_time, req.body.end_time, language, function (err, data) {

		if (req.baseUrl === '/api')
			return reply(res, err, data);
		else {
			if (err)
				req.flash('error', err);
			else
				req.flash('success', 'Schedule added');

			res.redirect('/loodle/' + req.params.id);
		}
	});

};

// Add a user to a loodle
LoodleController._addUser = function (req, res) {

	LoodleController.addUser(req.params.id, req.body.user_id, function (err, data) {
		return reply(res, err, data);
	});

};

// Create a new loodle
LoodleController._createLoodle = function (req, res) {

	// Validation
	// - req.user is defined
	// - req.body.name is defined
	// - req.body.description is optional

	LoodleController.createLoodle(req.user.id, req.body.name, req.body.description, function (err, data) {
		return reply(res, err, data);
	});

};

LoodleController._deleteSchedule = function (req, res) {

	LoodleController.deleteSchedule(req.params.id, req.body.schedule_id, function (err, data) {
		return reply(res, err, data);
	});

};

// Get loodle data
LoodleController._get = function (req, res) {

	LoodleController.get(req.params.id, function (err, data) {
		return reply(res, err, data);
	});

};

LoodleController._removeUser = function (req, res) {

	LoodleController.removeUser(req.params.id, req.body.user_id, function (err, data) {
		return reply(res, err, data);
	});

};

// Standard call function to send back data in json
function reply (res, err, data) {

    if (err) {
        res.status(500);
        return res.json({"data": err})
    }

    return res.json({"data": data});
}

// Loodle controller features =========================================

/**
 * Add a user to a loodle
 *
 * @param {uuid}        loodle_id   loodle identifier
 * @param {uuid}        user_id     user identifier
 * @param {Function}    callback    standard callback function
 */
LoodleController.addUser = function (loodle_id, user_id, callback) {

    // Check the loodle exists
    // Check the user is not already in the loodle
    // Create link loodle - user
    // Create default votes for each schedule of the loodle
    // Create default configuration for the user on the loodle
    
    async.parallel({

    	// Create link loodle - user
    	bind: function (done) {
    		Loodle.bindUser(user_id, loodle_id, done);
    	},

    	// Create default configuration
    	createDefaultConfiguration: function (done) {
    		Configuration.createDefaultConfiguration(user_id, loodle_id, done);
    	},

    	// Create default votes for user
    	createDefaultVotes: function (done) {
    		Vote.createDefaultVotesForUser(loodle_id, user_id, done);
    	}

    }, function (err) {
    	if (err)
    		return callback(err);

    	return callback(null, 'User added');
    });

};

/**
 * Create a new private loodle
 * 
 * @param  {uuid}   	user_id     	[user identifier]
 * @param  {String}   	name        	[name of the new loodle]
 * @param  {String}   	description 	[description of the new loodle]
 * @param  {Function} 	callback    	[standard callback function]
 * 
 * @return {Object}               		[Loodle object or error message]
 */
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
		},
		// Create default configuration for the user and set the user role as manager
		config: function (done) {

			async.series([
				function (end) {
					Configuration.createDefaultConfiguration(user_id, loodle.id, end);
				},

				function (end) {
					Configuration.setUserRole(user_id, loodle.id, 'manager', end);
				}
			], done);
		}
	}, function (err, results) {

		if (err)
			return callback(err)
		
		return callback(null, results.save);

	});

};

/**
 * Delete a schedule from a loodle
 * 
 * @param  {uuid}   	loodle_id   	loodle identifier
 * @param  {uuid}   	schedule_id 	schedule identifier
 * @param  {Function} 	callback    	standard callback function
 * @return {string}               		success or error message
 */
LoodleController.deleteSchedule = function (loodle_id, schedule_id, callback) {

	// Delete the association schedule - loodle
	// Delete schedule
	// Delete votes of the schedule for each user of the loodle

	async.parallel({

		// Delete the association schedule - loodle
		removeScheduleFromLoodle: function (done) {
			Loodle.removeSchedule(loodle_id, schedule_id, done);
		},

		// Delete schedule
		deleteSchedule: function (done) {
			Schedule.delete(schedule_id, done);
		},

		// Delete votes of the schedule for each user of the loodle
		deleteVotes: function (done) {
			Schedule.deleteVotes(schedule_id, loodle_id, done);
		}

	}, function (err) {
		if (err)
			return callback(err);

		return callback(null, 'schedule removed');
	});

};

/**
 * Remove a user from a loodle
 * 
 * @param  {uuid}   	loodle_id 	loodle identifier
 * @param  {uuid}   	user_id   	user identifier
 * @param  {Function} 	callback  	standard callback function
 * 
 * @return {string}             	success or error message
 */
LoodleController.removeUser = function (loodle_id, user_id, callback) {

	// Delete the association user - loodle
	// Delete votes of the user for each schedule of the loodle
	// Delete user configuration for the loodle
	// Delete user if he/she was temporary

	async.parallel({

        // Delete the association user - loodle
        removeUserFromLoodle: function (done) {
            Loodle.removeUser(loodle_id, user_id, done);
        },

        // Delete the votes of the user for each schedules of the loodle
        deleteVotes: function (done) {
            User.deleteVotes(user_id, loodle_id, done);
        },

        // Delete user configuration for the loodle
        deleteConfiguration: function (done) {
        	Configuration.delete(user_id, loodle_id, done);
        },

        // Delete user if he/she was temporary
        deleteUser: function (done) {
        	User.deleteIfTemporary(user_id, done);
        }

    }, function (err) {
    	if (err)
    		return callback(err);

    	return callback(null, 'user removed');
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

LoodleController.get = function (loodle_id, callback) {

	async.parallel({

		// Get loodle data
		loodle: function (done) {
			Loodle.get(loodle_id, done);
		},
		// Get users of the loodle
		users: function (done) {
			Loodle.getUsers(loodle_id, done);
		},
		// Get schedules of the loodle
		schedules: function (done) {
			Loodle.getSchedules(loodle_id, done);
		},
		// Get votes of the loodle
		votes: function (done) {
			Loodle.getVotes(loodle_id, done);
		}

	}, function (err, results) {

		if (results.loodle === undefined) {
			return callback('This loodle does not exists');
		} 

		// Format
		results.loodle.schedules = results.schedules;
		results.loodle.votes = results.votes;
		results.loodle.users = results.users;

		if (err)
			return callback(err);

		return callback(null, results.loodle);
	});

};

// Get a resume of the data ov every loodle on the user
// with his/her configuration for every loodle
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
		},

		// Get user configuration for the loodles
		function (loodles, done) {

			async.each(loodles, function (loodle, end) {

				Configuration.getUserConfiguration(req.user.id, loodle.id, function (err, data) {
					if (err)
						return end(err);
					
					loodle.user_config = data;
					return end();
				});

			}, function (err) {
				return done(err, loodles);
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

	// Delete the configurations user - loodle

	// Get the notification ids associated with the loodle
	// Delete these notifications

	var user_ids = [];

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

		},

		// Delete the configuration user - loodle
		deleteConfiguration: function (done) {

			async.each(user_ids, function (user_id, end) {
				Configuration.delete(user_id, loodle_id, end);
			}, done);

		},

		// Delete notifications
		deleteNotifications: function (done) {
			Notification.deleteFromLoodle(loodle_id, done);
		},

		// Delete user association 
		deleteUserAssociation: function (done) {

			async.series([

				// Get the user ids associated with the loodle
				function (end) {
					Loodle.getUserIds(loodle_id, function (err, data) {
						if (err)
							return end(err);

						user_ids = data;
						return end();
					});
				},

				// Delete the association loodle - user
				function (end) {

					async.each(user_ids, function (user_id, finish) {
						Loodle.removeAssociationLoodleUser(loodle_id, user_id, finish);
					}, end);

				}

			], done);

		}


	}, callback);

};

LoodleController.openToPublic = function (req, res) {

	Loodle.openToPublic(req.params.id, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'loodle open to public');
	})

};

LoodleController.check = function (req, res, next) {

	// Get the loodle data
	// If the loodle is set to public, no need to be authenticated
	// Otherwise, check authorization to access

	Loodle.get(req.params.id, function (err, loodle) {
		if (err)
			throw new Error(err);

		// Loodle public, no authentification required ======
		if (loodle.category === 'public')
			return next();

		// Loodle private, authentification required ========

		// No user authenticated
		if (!req.user) {
			req.flash('error', 'You need to be authenticated to access this loodle');
			return res.redirect('/login');
		}

		//  User authenticated

		// Get user of the loodle to see if the user has access
		// to the loodle
		Loodle.getUserIds(req.params.id, function (err, user_ids) {
			if (err)
				throw new Error(err);

			var authorized = false;

			user_ids.forEach(function (user_id) {
				if (user_id.equals(req.user.id))
					authorized = true;
			});

			// Authenticated and authorized
			if (authorized)
				return next();

			req.flash('error', "You don't have the permission to access this loodle");
			res.redirect('/login');
		});

	});

};

LoodleController.inviteUser = function (req, res) {

	// Check if the email is matching a user
	// Check if the user is not already in the loodle
	// Check if the user is not already invated to participate
	// Create the participation request and
	// bind it to the loodle and the invated user

	var invated_user_id = undefined;

	async.series({

		// Check if the email is matching a user
		emailMatching: function (done) {
			User.getByEmail(req.body.email, function (err, data) {
				if (err)
					return done(err);

				// No user found
				if (!data)
					return done('No user found with that email');

				invated_user_id = data.id;
				return done();
			});
		},

		// Check if the user is not already in the loodle
		checkUsers: function (done) {

			Loodle.getUserIds(req.params.id, function (err, user_ids) {
				if (err)
					return done(err);

				var alreadyParticipating = false;

				user_ids.forEach(function (user_id) {
					if (user_id.equals(invated_user_id))
						alreadyParticipating = true;
				});

				if (alreadyParticipating)
					return done('This user is already participating to the loodle');

				return done();
			});

		},

		// Check if the user is not already invated to participate
		checkInvatedUsers: function (done) {

			Loodle.getParticipationRequestsOfUser(invated_user_id, function (err, participation_requests) {
				if (err)
					return done(err);

				var alreadyInvated = false;

				participation_requests.forEach(function (pr) {
					if (pr.doodle_id == req.params.id)
						alreadyInvated = true;
				});

				if (alreadyInvated)
					return done('This user is already invated to participate to the loodle');

				return done();
			});

		},

		// Create the participation request and bind it to the
		// loodle and the invated user
		createPR: function (done) {
			ParticipationRequest.createParticipationRequest(req.params.id, req.user.id, req.body.email, function (err, data) {
				if (err)
					return done(err);

				return done();
			});
		}
	}, function (err) {
		if (err)
			req.flash('error', err);
		else
			req.flash('success', 'Participation request send');

		res.redirect('/loodle/' + req.params.id);
	});

};

LoodleController.addSchedule = function (loodle_id, begin_time, end_time, language, callback) {

	// Check if the two dates of the schedule are on the same day
	// Create the new schedule
	// Bind it to the loodle
	// Create the default votes according to the schedule

	async.series({

		// Check if the two dates of the schedule are on the same day
		checkSchedule: function (done) {
			Schedule.checkSchedule(begin_time, end_time, language, done);
		},

		// Create the new schedule 
		createSchedule: function (done) {
			Schedule.createSchedule(loodle_id, begin_time, end_time, language, done);
		}

	}, function (err) {
		if (err)
			return callback(err);

		return callback(null, 'Schedule added');
	});

};

LoodleController.createPublicLoodle = function (req, res) {

	var loodle = new Loodle(req.body.name, req.body.description, 'public');
	async.parallel({
		// Save the loodle
		save: function (done) {
			loodle.save(done);
		},
		// Create and add the schedule to it
		addSchedule: function (done) {

			async.each(req.body.schedules, function (schedule, end) {

				async.series({

					// Check if the two dates of the schedule are on the same day
					checkSchedule: function (finish) {
						Schedule.checkSchedule(schedule.begin_time, schedule.end_time, req.cookies.mylanguage, finish);
					},

					// Create the new schedule 
					createSchedule: function (finish) {
						Schedule.createSchedule(loodle.id, schedule.begin_time, schedule.end_time, req.cookies.mylanguage, finish);
					}
				}, end);

			}, done);
		}
	}, function (err, results) {

		if (err)
			return error(res, err);
		
		return success(res, results.save);

	});	
};

LoodleController.setCategory = function (req, res) {

	Loodle.setCategory(req.params.id, req.body.category, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'Loodle category updated');
	});
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