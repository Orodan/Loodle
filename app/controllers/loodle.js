var async                = require('async');
var bcrypt               = require('bcrypt-nodejs');
var Loodle               = require('../models/loodle.model');

var User                 = require('./user');
var ParticipationRequest = require('./participation-request');
var Schedule             = require('./schedule');
var Configuration        = require('./configuration');
var Notification         = require('./notification');
var Vote                 = require('./vote');

var Validator = require('../../util/validator');

var LoodleController = {};

/////////////////
// Route calls //
/////////////////

/**
 * Route call to add a schedule to the loodle
 * 
 * @param {Object} 	req 	Incomming request
 * @param {Object} 	res 	Response to send
 */
LoodleController._addSchedule = function (req, res) {

	var language;
	if (req.baseUrl === '/api')
		language = req.body.language;
	else
		language = req.cookies.mylanguage;

	// Check if the mandatory arguments have been send
	if(!Validator.isDefined(language))
		return reply(res, 'Attribute "language" required', 400);
	if(!Validator.isDefined(req.body.begin_time))
		return reply(res, 'Attribute "begin_time" required', 400);
	if(!Validator.isDefined(req.body.end_time))
		return reply(res, 'Attribute "end_time" required', 400);

	LoodleController.addSchedule(req.params.id, req.body.begin_time, req.body.end_time, language, function (err, data) {

		if (req.baseUrl === '/api') {
			if (err) return reply(res, err.message, data);
			else return reply(res, err, 'Schedule added');
		}
		else {
			if (err)
				req.flash('error', err);
			else
				req.flash('success', 'Schedule added');

			res.redirect('/loodle/' + req.params.id);
		}
	});

};

/**
 * Route call to add an user to the loodle
 * 
 * @param {Object} 	req 	Incomming request
 * @param {Object} 	res 	Response to send
 */
LoodleController._addUser = function (req, res) {

	LoodleController.addUser(req.params.loodleId, req.params.userId, function (err, data) {
		if (err) if (err) return reply(res, err.message, data);

		return reply(res, err, data);
	});

};

/**
 * Route call to create a new loodle
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._createLoodle = function (req, res) {

	LoodleController.createLoodle(req.user.id, req.body.name, req.body.description, function (err, data) {
		if (err) return reply(res, err.message, data);
		return reply(res, err, data);
	});

};

/** 
 * Route call to delete a schedule from the loodle
 * 
 * @param  {Object}		req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._deleteSchedule = function (req, res) {

	LoodleController.deleteSchedule(req.params.loodleId, req.params.scheduleId, function (err, data) {
		if (err) return reply(res, err.message, data)
		return reply(res, err, data);
	});

};

/** 
 * Route call to get the loodle data
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {[type]} 	res 	Response to send
 */
LoodleController._get = function (req, res) {

	LoodleController.get(req.params.id, function (err, data) {
		if (err) return reply(res, err.message, data);
		return reply(res, err, data);
	});

};

/**
 * Route call to remove an user from the loodle
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._removeUser = function (req, res) {

	LoodleController.removeUser(req.params.loodleId, req.params.userId, function (err, data) {
		if (err) return reply(res, err.message, data);
		return reply(res, err, data);
	});

};

/**
 * Route call to get registred users
 * 
 * @param  {Object} 	req 	Incomming request	
 * @param  {Object} 	res 	Response to send
 */
LoodleController._getRegistredUsers = function (req, res) {

	LoodleController.getRegistredUsers(req.params.id, function (err, data) {
		if (err) return reply(res, err.message, data);
		return reply(res, err, data);
	});

};

/**
 * Route call to get the resume data of the loodle
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._getResume = function (req, res) {

	Loodle.get(req.params.id, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

/**
 * Route call to get loodle's users
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._getUsers = function (req, res) {

	Loodle.getUsers(req.params.id, function (err, data) {
		if (err)
			return error(res, error);

		return success(res, data);
	});

};

/**
 * Route call to get loodle's votes
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._getVotes = function (req, res) {

	Loodle.getVotes(req.params.id, function (err, data) {
		if (err)
			return error(res, error);

		return success(res, data);
	});

};

/**
 * Route call to get loodle's schedules
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._getSchedules = function (req, res) {

	Loodle.getSchedules(req.params.id, function (err, data) {

		if (err)
			return error(res, error);

		return success(res, data);
	});

};

/**
 * Route call to get a resume of the data ov every loodle on the user with his/her configuration for every loodle
 *  
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._getLoodlesOfUser = function (req, res) {

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

/**
 * Route call to check if the user is accessing an public or private loodle
 * 
 * @param  {Object}   req  		Incomming request
 * @param  {Object}   res  		Response to send
 * @param  {Function} next 		Following function
 */
LoodleController._check = function (req, res, next) {

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

/** 
 * Route call to invite an user to participate to the loodle
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._inviteUser = function (req, res) {

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

/**
 * Route call to create a public loodle
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
LoodleController._createPublicLoodle = function (req, res) {

	LoodleController.createPublicLoodle(req.body.name, req.body.description, req.body.schedules, req.cookies.mylanguage, function (err, data) {
		if (err)
			return error(res, err);
		
		return success(res, data);
	});

};

/**
 * Route call to set the category of the loodle (private or public)
 * 
 * @param {Object} 		req 	Incomming request
 * @param {Object} 		res 	Response to send
 */
LoodleController._setCategory = function (req, res) {

	Loodle.setCategory(req.params.id, req.body.category, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'Loodle category updated');
	});
	
};

// Standard call function to send back data in json
function reply (res, err, data) {

    if (err) {
		if (data === undefined)
        	data = 500;

		res.status(data);
        return res.json({"data": err})
    }

    return res.json({"data": data});
}

////////////////////////////////
// Loodle controller features //
////////////////////////////////

/**
 * Get the registred users of the loodle
 * 
 * @param  {Uuid}   	loodleId 	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
LoodleController.getRegistredUsers = function (loodleId, callback) {

	async.waterfall([

		// Get the users of the loodle
		function (done) {
			Loodle.getUsers(loodleId, done);
		},

		// Filter the users to only get those registred
		function (users, done) {

			var registredUsers = [];

			users.forEach(function (user, index) {
				if (user.status === "registred")
					registredUsers.push(user);
			});

			return done(null, registredUsers);
			
		}
	], callback)


};

/**
 * Add a user to a loodle
 *
 * @param {uuid}        loodle_id   Loodle identifier
 * @param {uuid}        user_id     User identifier
 * @param {Function}    callback    Standard callback function
 */
LoodleController.addUser = function (loodle_id, user_id, callback) {

   	async.series({

   		// Validate the loodle id is known
		loodleIdIsKnown: function (end) {
			Validator.loodle.knownId(loodle_id, function (err, result) {
				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('Unknown loodle id'));

				return end();
			});
		},

		// Validate the user id is known
		userIdIsKnown: function (end) {
			Validator.user.knownId(user_id, function (err, result) {
				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('Unknown user id'));

				return end();
			});
		},

   		// Validate the user is not already in the loodle
   		userAlreadyInLoodle: function (end) {
   			Validator.user.isInLoodle(loodle_id, user_id, function (err, result) {
   				if (err) return end(err);

   				if (result)
   					return end(new Error('User already present in loodle'));

   				return end();
   			});
   		},

   		// Add the user to the loodle
   		addUser: function (end) {

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

   			}, end);

   		}

   	}, function (err) {
   		if (err) return callback(err);

   		return callback(null, 'User added');
   	});

};

/**
 * Create a new private loodle
 * 
 * @param  {uuid}   	user_id     	User identifier
 * @param  {String}   	name        	Name of the new loodle
 * @param  {String}   	description 	Description of the new loodle
 * @param  {Function} 	callback    	Standard callback function
 */
LoodleController.createLoodle = function (user_id, name, description, callback) {

	var loodle = new Loodle(name, description);

	if (!Validator.loodle.hasAllInformations(name))
		return callback(new Error('Missing one parameter'));

	Validator.user.knownId(user_id, function (err, result) {
		if (err) return callback(err);

		if (!result)
			return callback(new ReferenceError('Unknown user id'));

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

	});

};

/**
 * Delete a schedule from a loodle
 * 
 * @param  {uuid}   	loodle_id   	Loodle identifier
 * @param  {uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
LoodleController.deleteSchedule = function (loodle_id, schedule_id, callback) {

	async.series({

		// Validate the loodle id is known
		loodleIdIsKnown: function (end) {
			Validator.loodle.knownId(loodle_id, function (err, result) {

				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('Unknown loodle id'));

				return end();
			});
		},

		// Validate the schedule id is known
		scheduleIdIsKnown: function (end) {
			Validator.schedule.knownId(schedule_id, function (err, result) {

				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('Unknown schedule id'));

				return end();
			});
		},

		// Delete schedule
		deleteSchedule: function (end) {

			async.series({

				// Delete votes of the schedule for each user of the loodle
				deleteVotes: function (done) {
					Schedule.deleteVotes(schedule_id, loodle_id, done);
				},

				// Delete the association schedule - loodle
				removeScheduleFromLoodle: function (done) {
					Loodle.removeSchedule(loodle_id, schedule_id, done);
				},

				// Delete schedule
				deleteSchedule: function (done) {
					Schedule.delete(schedule_id, done);
				}

			}, end);

		}

	}, function (err) {
		if (err) return callback(err);

		return callback(null, 'Schedule deleted');
	});

};

/**
 * Remove a user from a loodle
 * 
 * @param  {uuid}   	loodle_id 	Loodle identifier
 * @param  {uuid}   	user_id   	User identifier
 * @param  {Function} 	callback  	Standard callback function
 */
LoodleController.removeUser = function (loodle_id, user_id, callback) {

	async.series({

		// Check if this loodle id is unknown
		loodleIdIsKnown: function (end) {

			Validator.loodle.knownId(loodle_id, function (err, result) {
				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('Unknown loodle id'));

				return end();
			});

		},

		// Check if this user id is unknown
		userIdIsKnown: function (end) {

			Validator.user.knownId(user_id, function (err, result) {
				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('Unknown user id'));

				return end();
			});

		},

		// Check if the user is indeed in the loodle
		isInLoodle: function (end) {

			Validator.user.isInLoodle(loodle_id, user_id, function (err, result) {
				if (err) return end(err);

				if (!result)
					return end(new ReferenceError('The user is not present is the loodle'));

				return end();
			});

		},

		isTheLastUser: function (end) {

			// Get the users of the loodle to check if the one we want to delete is the last one
			// If that's the case, we must delete the loodle itself
			Loodle.getUserIds(loodle_id, function (err, user_ids) {
				if (err) return end(err);

				if (typeof user_id === 'object')
					user_id = user_id.toString();

				if (user_ids.length === 1) {
					// The user we want to remove is the last user present in the loodle
					if (user_ids[0] == user_id) {
						LoodleController.delete(loodle_id, function (err) {
							if (err) return end(err);

							return callback(null, 'Loodle deleted');
						});
					}
					else {
						return end(new ReferenceError('The user is not present in the loodle'));
					}
				}
				else
					return end();

			})
		},

		// Remove user
		removeUser: function (end) {

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

			}, end);

		}
	}, function (err) {

		if (err) return callback(err);

		return callback(null, 'User removed');
	});

};

/**
 * Get the loodle data
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
LoodleController.get = function (loodle_id, callback) {

	async.series({

		// Validate we know the loodle id
		validateLoodleId: function (end) {
			Validator.loodle.knownId(loodle_id, function (err, result) {
				if (err) return end(err);
				if (!result) return end(new ReferenceError('Unknown loodle id'));
				return end();
			});
		},

		// Get loodle data
		getLoodle: function (end) {
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
				if (err) return end(err);

				// Format
				results.loodle.schedules = results.schedules;
				results.loodle.votes = results.votes;
				results.loodle.users = results.users;

				return end(null, results.loodle);
			});
		}
	}, function (err, data) {
		if (err) return callback(err);
		return callback(null, data.getLoodle);
	});

};

/**
 * Delete a loodle
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {Function} callback  	Standard callback function
 */
LoodleController.delete = function (loodle_id, callback) {

	async.series({
		// Validate we know the loodle id
		validateLoodleId: function (done) {
			Validator.loodle.knownId(loodle_id, function (err, result) {
				if (err) return done(err);
				if (!result) return done(new ReferenceError('Unknown loodle id'));
				return done();
			});
		},

		// Delete the loodle
		deleteLoodle: async.apply(Loodle.delete, loodle_id)
	}, function (err) {
		if (err) return callback(err);
		return callback(null, 'Loodle deleted');
	});

};

/**
 * Add a new schedule to a loodle
 * 
 * @param {String}   loodle_id  	Loodle identifier
 * @param {String}   begin_time 	Begin time of the schedule
 * @param {String}   end_time   	End time of the schedule
 * @param {String}   language   	Locale language
 */
LoodleController.addSchedule = function (loodle_id, begin_time, end_time, language, callback) {

	if(!Validator.schedule.isAKnownLanguage(language)) 
		return callback(new Error('Unknown language'));
	if (!Validator.schedule.isOnTheSameDay(begin_time, end_time, language)) 
		return callback(new Error('Schedule is not on the same day'));

	Validator.loodle.knownId(loodle_id, function (err, result) {
		if (err) return callback(err);

		if (!result)
			return callback(new ReferenceError('Unknown loodle id'));

		async.series({
			// Create the new schedule 
			createSchedule: function (done) {
				Schedule.createSchedule(loodle_id, begin_time, end_time, language, done);
			}

		}, function (err) {
			if (err) return callback(err);

			return callback(null, 'Schedule added');
		});
	})

};

/**
 * Create a public loodle
 * 
 * @param  {String}   	name        	Loodle's name
 * @param  {String}   	description 	Loodle's description
 * @param  {Array}   	schedules   	Loodle's schedules
 * @param  {String}   	locale      	Loodle's schedule locale language
 * @param  {Function} 	callback    	Standard callback function
 */
LoodleController.createPublicLoodle = function (name, description, schedules, locale, callback) {

	if (!Validator.loodle.hasAllInformations(name))
		return callback(new Error('Missing one parameter'));

	if(!Validator.schedule.isAKnownLanguage(locale))
		return callback(new Error('Unknown language'));

	if (!Validator.loodle.mustHaveAtLeastOneSchedule(schedules))
		return callback(new Error('At least one schedule is required'));

	async.series({

		checkSchedules: function (end) {
			async.each(schedules, function (schedule, done) {
				if (!Validator.schedule.isOnTheSameDay(schedule.begin_time, schedule.end_time, locale))
					return done(new Error('Schedule is not on the same day'));

				return done();
			}, end);
		},

		createLoodle: function (end) {

			var loodle = new Loodle(name, description, 'public');

			async.parallel({
				// Save the loodle
				save: function (done) {
					loodle.save(done);
				},
				// Create and add the schedule to it
				addSchedule: function (done) {

					async.each(schedules, function (schedule, finish) {
						Schedule.createSchedule(loodle.id, schedule.begin_time, schedule.end_time, locale, finish);
					}, done);

				}
			}, function (err, results) {
				if (err) return end(err);

				return end(null, results.save);
			});

		}

	}, function (err, results) {
		if (err) return callback(err);

		return callback(null, results.createLoodle);
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