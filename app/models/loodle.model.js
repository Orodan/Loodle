var db            = require('../../config/database');
var cassandra     = require('cassandra-driver');
var async         = require('async');

var Vote          = require('./vote.model');
var User 	 	  = require('./user.model');
var Schedule      = require('./schedule.model');
var Notification  = require('./notification.model');
var PR 			  = require('./participation-request.model');;
var Configuration = require('./configuration.model');

/**
 * Create a new loodle object
 *
 * @class Loodle
 * @param {String} name        	Loodle's name
 * @param {String} description 	Loodle's description
 * @param {String} category    	Loodle's category
 */
function Loodle (name, description, category) {
	this.id = cassandra.types.Uuid.random();
	this.name = name;
	this.description = description;
	this.created = Date.now();
	this.category = (category) ? category : 'private';
}

//////////////////////////
// Prototypal functions //
//////////////////////////

/**
 * Save the loodle in db
 * 
 * @param  {Function} callback 	Standard callback function
 */
Loodle.prototype.save = function (callback) {

	var self = this;

	var query = 'INSERT INTO doodles (id, category, created, description, name) values (?, ?, ?, ?, ?)';
	db.execute(query
		, [ this.id, this.category, this.created, this.description, this.name]
	    , { prepare: true }
	    , function (err) {
	    	if (err)
	    		return callback(err);

	    	Loodle.get(self.id, callback);
	    }
	);

};

/**
 * Remove the user from the loodle
 * 
 * @param  {Uuid}   	loodle_id 	Loodle indentifier
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Loodle.removeUser = function (loodle_id, user_id, callback) {

	var queries = [
		{
			query: 'DELETE FROM user_by_doodle WHERE doodle_id = ? AND user_id = ?',
			params: [ loodle_id, user_id ]
		},
		{
			query: 'DELETE FROM doodle_by_user WHERE user_id = ? AND doodle_id = ?',
			params: [ user_id, loodle_id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, callback);

};

/**
 * Associate the user to the loodle
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Loodle.bindUser = function (user_id, loodle_id, callback) {

	var queries = [
		{
			query: 'INSERT INTO doodle_by_user (user_id, doodle_id) values (?, ?)',
			params: [ user_id, loodle_id ]
		},
		{
			query: 'INSERT INTO user_by_doodle (doodle_id, user_id) values (?, ?)',
			params: [ loodle_id, user_id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, function (err) {
			return callback(err);
		});

};

/**
 * Get loodle data
 * 
 * @param  {Uuid}   	id       	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.get = function (id, callback) {

	var query = 'SELECT * FROM doodles WHERE id = ?';
	db.execute(query
		, [ id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			if (data.rows.length === 0)
				return callback('No loodle found with this id');

			return callback(null, data.rows[0]);
		}
	);

};

/**
 * Get ids of the loodle's users
 * 
 * @param  {Uuid}   	id       	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.getUsersIds = function (id, callback) {

	var query = 'SELECT user_id FROM user_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
				results.push(element.user_id);
			});

			return callback(null, results);
		}
	);

};

/**
 * Get loodle's users
 * 
 * @param  {Uuid}   	id       	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.getUsers = function (id, callback) {

	var results = [];

	async.waterfall([
		// Get users id
		function (done) {
			Loodle.getUsersIds(id, done);
		},
		// Get users data
		function (user_ids, done) {

			async.eachSeries(user_ids, function (user_id, end) {

				var query = 'SELECT id, email, first_name, last_name, status FROM users WHERE id = ?';
				db.execute(query
					, [ user_id ]
					, { prepare : true }
					, function (err, data) {
						if (err)
							return end(err);

						results.push(data.rows[0]);
						return end();
					}
				);

			}, done);

		}
	], function (err) {
		return callback(err, results);
	});

};

/**
 * Get loodle's schedules
 * 
 * @param  {Uuid}   	id       	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.getSchedules = function (id, callback) {

	var results = [];

	async.waterfall([
		// Get schedules id
		function (done) {
			var query = 'SELECT schedule_id FROM schedule_by_doodle WHERE doodle_id = ?';
			db.execute(query
				, [ id ]
				, { prepare : true }
				, function (err, data) {
					if (err)
						return done(err);

					return done(null, data.rows);
				}
			);
		},
		// Get schedules data
		function (schedule_ids, done) {

			async.each(schedule_ids, function (element, end) {

				var query = 'SELECT * FROM schedules WHERE id = ?';
				db.execute(query
					, [ element.schedule_id ]
					, { prepare : true }
					, function (err, data) {
						if (err)
							return end(err);

						results.push(data.rows[0]);
						return end();
					}
				);

			}, done);

		}
	], function (err) {

		results.sort(function (a, b) {
			return new Date(a.begin_time) - new Date(b.begin_time);
		});

		return callback(err, results);
	});

};

/**
 * Get loodle's votes
 * 
 * @param  {Uuid}   	id       	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.getVotes = function (id, callback) {

	var results = [];

	async.waterfall([
		// Get users ids
		function (done) {
			Loodle.getUsersIds(id, done);
		},
		// Get votes ids
		function (user_ids, done) {

			async.each(user_ids, function (user_id, end) {

				var query = 'SELECT user_id, schedule_id, vote_id FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ?';
				db.execute(query
					, [ id, user_id ]
					, { prepare : true }
					, function (err, data) {

						if (err)
							return end(err);

						data.rows.forEach(function (element) {
							results.push(element);
						});

						return end();
					});

			}, done);
		},
		// Get vote value
		function (done) {

			async.each(results, function (element, end) {

				var query = 'SELECT vote FROM votes WHERE id = ?';
				db.execute(query
					, [ element.vote_id ]
					, { prepare : true}
					, function (err, data) {
						if (err)
							return end(err);

						element.vote = data.rows[0].vote;
						return end();
					});
			}, done);
		}
	], function (err) {
		return callback(err, results);
	});

};

/**
 * Get loodle ids of the user
 * 
 * @param  {Uuid}   	user_id  	User identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.getLoodleIdsOfUser = function (user_id, callback) {

	var query = 'SELECT doodle_id FROM doodle_by_user WHERE user_id = ?';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, function (err, data) {

			if (err)
				return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
				results.push(element.doodle_id);
			});

			return callback(null, results);
		});

};

/**
 * Delete the loodle
 * 
 * @param  {Uuid}   	loodleId 	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.delete = function (loodleId, callback) {

	var userIds,
		notificationIds,
		participationRequests;

	async.series({
		getRequiredInformations: function (done) {

			async.parallel({
				getUserIds: async.apply(Loodle.getUserIds, loodleId),
				getNotificationIds: async.apply(Loodle.getNotificationIds, loodleId),
				getPR: async.apply(Loodle.getParticipationRequests, loodleId)
			}, function (err, results) {
				userIds = results.getUserIds;
				participationRequests = results.getPR;
				return done();
			});

		},

		delete: function (done) {

			async.parallel({
				removeUsers: async.apply(Loodle.removeUsers, loodleId, userIds),
				deleteVotes: async.apply(Loodle.deleteVotes, loodleId),
				deleteSchedules: async.apply(Loodle.deleteSchedules, loodleId),
				deleteNotifications: async.apply(Loodle.deleteNotifications, loodleId, userIds, notificationIds),
				deletePR: async.apply(Loodle.deletePR, loodleId, participationRequests),
				deleteLoodle: async.apply(Loodle.deleteLoodle, loodleId)
			}, done);

		}
	}, callback);

};

/**
 * Delete the loodle's participation requests
 * 
 * @param  {String}   	loodleId              	Loodle identifier
 * @param  {Array}   	participationRequests 	ParticipationRequests Array
 * @param  {Function} 	callback              	Standard callback function
 */
Loodle.deletePR = function (loodleId, participationRequests, callback) {

	// Get pr ids
	Loodle.getParticipationRequestIds(loodleId, function (err, prIds) {
		if (err) return callback(err);

		async.parallel({
			// Delete pr
			deletePr: function (done) {
				async.each(prIds, PR.delete, done);
			},

			// Delete associations
			deleteAssociations: function (done) {
				async.parallel({
					deleteAssociationsWithLoodle: async.apply(PR.deleteAssociationsWithLoodle, loodleId),
					deleteAssociationsWithUsers: async.apply(PR.deleteAssociationsWithUsers, participationRequests)
				}, done);
			}

		}, callback);
	});

};

/**
 * Get ids of users invated to participate to the loodle
 * 
 * @param  {String}   loodleId 		Loodle identifier
 * @param  {Function} callback 		Standard callback function
 */
Loodle.getInvatedUserIds = function (loodleId, callback) {

	// Get participation requests
	Loodle.getParticipationRequests(loodleId, function (err, data) {
		if (err) return callback(err);

		// Get "to_id" attributes
		var invatedUserIds = [];
		data.forEach(function (element) {
			invatedUserIds.push(element.to_id);
		});

		return callback(null, invatedUserIds);
	});

};

/**
 * Get participation requests of the loodle
 * 
 * @param  {String}   loodleId 	Loodle identifier
 * @param  {Function} callback 	Standard callback function
 */
Loodle.getParticipationRequests = function (loodleId, callback) {

	var query = 'SELECT * FROM participation_requests WHERE id = ?';
	db.execute(query, [ loodleId ], { prepare : true }, function (err, result) {
		if (err) return callback(err);

		return callback(null, result.rows);
	});

};

/**
 * Remove users of the loodle
 * 
 * @param  {String}   	loodleId 	Loodle identifier
 * @param  {Array}   	userIds  	User ids's array
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.removeUsers = function (loodleId, userIds, callback) {

	async.parallel({
		// Remove user - loodle associations
		removeUserLoodleAssociations: function (done) {
			async.each(userIds, function (userId, end) {
				var query = 'DELETE FROM doodle_by_user WHERE user_id = ? AND doodle_id = ?';
				db.execute(query, [ userId, loodleId ], { prepare: true }, end);
			}, done);
		},

		// Remove loodle - user associations
		removeLoodleUserAssociations: function (done) {
			var query = 'DELETE FROM user_by_doodle WHERE doodle_id = ?';
			db.execute(query, [ loodleId ], { prepare: true }, done);
		},

		// Delete user configurations
		deleteConfigurations: function (done) {
			async.each(userIds, function (userId, end) {
				Configuration.delete(userId, loodleId, end);
			}, done);
		},

		// Delete public users
		deletePublicUsers: function (done) {
			async.each(userIds, User.deleteIfTemporary, done);
		}

	}, callback);

};

/**
 * Delete the loodle itself
 * 
 * @param  {Uuid}   	loodleId 	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Loodle.deleteLoodle = function (loodleId, callback) {

	var query = 'DELETE FROM doodles WHERE id = ?';
	db.execute(query, [ loodleId ], { prepare : true }, callback);

};

/**
 * Get the ids of the loodle's schedules
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Loodle.getScheduleIds = function (loodle_id, callback) {

	var query = 'SELECT schedule_id FROM schedule_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
				results.push(element.schedule_id);
			});

			return callback(null, results);
		});

};

/**
 * Remove the schedule from the loodle
 * 
 * @param  {String}   loodle_id  	Loodle identifier
 * @param  {String}   schedule_id 	Schedule identifier
 * @param  {Function} callback    	Standard callback function
 */
Loodle.removeSchedule = function (loodle_id, schedule_id, callback) {

	var query = 'DELETE FROM schedule_by_doodle WHERE doodle_id = ? AND schedule_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, callback);

};

/**
 * Get ids of the loodle's users
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {Function} callback  	Standard callback function
 */
Loodle.getUserIds = function (loodle_id, callback) {

	var query = 'SELECT user_id FROM user_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
				results.push(element.user_id)
			});

			return callback(null, results);
		});

};

/**
 * Remove the association between the loodle and the user
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {String}   user_id   	User identifier
 * @param  {Function} callback  	Standard callback function
 */
Loodle.removeAssociationWithUser = function (loodle_id, user_id, callback) {

	var queries = [
		{
			query: 'DELETE FROM doodle_by_user WHERE user_id = ? AND doodle_id = ?',
			params: [ user_id, loodle_id ]
		},
		{
			query: 'DELETE FROM user_by_doodle WHERE doodle_id = ?',
			params: [ loodle_id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, callback);

};

/**
 * Get the ids of the loodle's votes
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {Function} callback  	Standard callback function
 */
Loodle.getVoteIds = function (loodle_id, callback) {

	var query = 'SELECT vote_id FROM vote_by_doodle_and_user WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, data) {

			if (err)
				return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
				results.push(element.vote_id)
			});

			return callback(null, results);

		});

};

/**
 * Remove the vote
 * 
 * @param  {String}   vote_id  		Vote identifier
 * @param  {Function} callback 		Standard callback function
 */
Loodle.removeVote = function (vote_id, callback) {

	var query = 'DELETE FROM votes WHERE id = ?';
	db.execute(query
		, [ vote_id ]
		, { prepare : true }
		, callback);

};

/**
 * Remove the association between the loodle and its votes 
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {Function} callback  	Standard callback function
 */
Loodle.removeAssociationLoodleVote = function (loodle_id, callback) {

	var queries = [
		{
			query: 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ?',
			params: [ loodle_id ]
		},
		{
			query: 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ?',
			params: [ loodle_id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, callback);

};


/**
 * Get the ids of the loodles's participation requests
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {Function} callback  	Standard callback function
 */
Loodle.getParticipationRequestIds = function (loodle_id, callback) {

	var query = 'SELECT participation_request_id FROM participation_request_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
				results.push(element.participation_request_id);
			});

			return callback(null, results);
		});

};

/**
 * Remove the participatin request
 * 
 * @param  {String}   participation_request_id 		Participation request identifier
 * @param  {Function} callback                 		Standard callback function
 */
Loodle.removeParticipationRequest = function (participation_request_id, callback) {

	var query = 'DELETE FROM participation_requests WHERE id = ?';
	db.execute(query
		, [ participation_request_id ]
		, { prepare : true }
		, callback);

};

/**
 * Get the id of the user who have the participation request
 * 
 * @param  {String}   participation_request_id 		Participation request identifier
 * @param  {Function} callback                 		Standard callback function
 */
Loodle.getUserIdWithParticipationRequest = function (participation_request_id, callback) {

	var query = 'SELECT to_id FROM participation_requests WHERE id = ?';
	db.execute(query
		, [ participation_request_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0].to_id);
		});

};

/**
 * Remove the assocation between the user and his/her participation requests
 * 
 * @param  {String}   user_id  		User identifier
 * @param  {Function} callback 		Standard callback function
 */
Loodle.removeAssocationUserParticipationRequest = function (user_id, callback) {

	var query = 'DELETE FROM participation_request_by_user WHERE user_id = ?';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, callback);

};

/**
 * Remove the assocation between the loodle and its participation requests
 * 
 * @param  {String}   loodle_id 	Loodle identifier
 * @param  {Function} callback  	Standard callback function
 */
Loodle.removeAssociationLoodleParticipationRequest = function (loodle_id, callback) {

	var query = 'DELETE FROM participation_request_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, callback);

};

/**
 * Get the participation requests of the user
 * 
 * @param  {String}   user_id  		User identifier
 * @param  {Function} callback 		Standard callback function
 */
Loodle.getParticipationRequestsOfUser = function (user_id, callback) {

	// Get participation request ids
	// For each of them, get participation request data

	async.waterfall([

		// Get participation request ids
		function (done) {

			var query = 'SELECT participation_request_id FROM participation_request_by_user WHERE user_id = ?';
			db.execute(query
				, [ user_id ]
				, { prepare : true }
				, function (err, data) {
					if (err)
						return done(err);

					var results = [];
					data.rows.forEach(function (element) {
						results.push(element.participation_request_id);
					});

					return done(null, results);
				});

		},

		// For each of them, get participation request data
		function (pr_ids, done) {

			var results = [];

			async.each(pr_ids, function (pr_id, end) {

				var query = 'SELECT * FROM participation_requests WHERE id = ?';
				db.execute(query
					, [ pr_id ]
					, { prepare : true }
					, function (err, data) {
						if (err)
							return end(err);

						results.push(data.rows[0]);
						return end();
					});

			}, function (err) {
				if (err)
					return done(err);

				return done(null, results);
			});

		}

	], function (err, result) {
		if (err)
			return callback(err);

		return callback(null, result);
	});

};

/**
 * Set the loodle's category
 * 
 * @param {String}   loodle_id 		Loodle identifier
 * @param {String}   category  		Category
 */
Loodle.setCategory = function (loodle_id, category, callback) {

	var query = 'UPDATE doodles SET category = ? WHERE id = ?';
	db.execute(query
		, [ category, loodle_id ]
		, { prepare : true }
		, callback);

};

/**
 * Delete loodle's votes
 * 
 * @param  {String}   loodleId 		Loodle identifier
 * @param  {Function} callback 		Standard callback function
 */
Loodle.deleteVotes = function (loodleId, callback) {

	// Get the vote ids
	Loodle.getVoteIds(loodleId, function (err, voteIds) {
		if (err) return callback(err);

		async.parallel({
			// Delete vote ids
			deleteVotes: function (done) {
				async.each(voteIds, Vote.delete, done);
			},

			// Delete associations
			deleteAssociations: function (done) {
				Vote.deleteAssociationsWithLoodle(loodleId, done);
			}
		}, callback)

	});

};

/**
 * Delete loodle's schedules
 * 
 * @param  {String}   loodleId 		Loodle identifier
 * @param  {Function} callback 		Standard callback function
 */
Loodle.deleteSchedules = function (loodleId, callback) {

	// Get schedule ids
	Loodle.getScheduleIds(loodleId, function (err, scheduleIds) {
		if (err) return callback(err);

		async.parallel({
			// Delete schedules
			deleteSchedules: function (done) {
				async.each(scheduleIds, Schedule.delete, done);
			},

			// Delete associations
			deleteAssociations: function (done) {
				Schedule.deleteAssociationsWithLoodle(loodleId, done);
			}
		}, callback);

	});

};

/**
 * Delete loodle's notifications
 * 
 * @param  {String}   	loodleId        	Loodle identifier
 * @param  {Array}   	userIds         	User ids's array
 * @param  {Array}   	notificationIds 	Notification ids's array
 */
Loodle.deleteNotifications = function (loodleId, userIds, notificationIds, callback) {

	// Get notification ids
	Loodle.getNotificationIds(loodleId, function (err, notificationIds) {
		if (err) return callback(err);

		async.parallel({
			// Delete notifications
			deleteNotifications: function (done) {
				async.each(notificationIds, Notification.delete, done);
			},

			// Delete associations
			deleteAssociations: function (done) {
				async.parallel({
					deleteAssociationsWithLoodle: async.apply(Notification.deleteAssociationsWithLoodle, loodleId),
					deleteAssociationsWithUsers: function (end) {
						async.each(userIds, function (userId, finish) {
							async.each(notificationIds, function (notificationId, over) {
								Notification.deleteAssociationWithUser(userId, notificationId, over);
							}, finish);
						}, end);
					}
				}, done);
			}

		}, callback);

	});

};

/**
 * Get ids of loodle's notifications
 * 
 * @param  {String}   loodleId 		Loodle identifier
 * @param  {Function} callback 		Standard callback function
 */
Loodle.getNotificationIds = function (loodleId, callback) {

	var query = 'SELECT notification_id FROM notification_by_doodle WHERE doodle_id = ?';
	db.execute(query, [ loodleId ], { prepare : true }, function (err, data) {
		if (err) return callback(err);

		return callback(null, data.rows);
	});

};


module.exports = Loodle;