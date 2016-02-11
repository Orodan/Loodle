var db            = require('../../config/database');
var cassandra     = require('cassandra-driver');
var async         = require('async');

var Configuration = require('./configuration.model');

function Loodle (name, description, category) {
	this.id = cassandra.types.Uuid.random();
	this.name = name;
	this.description = description;
	this.created = Date.now();
	this.category = (category) ? category : 'private';
}

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

}

/**
 * Remove the association loodle - user
 * 
 * @param  {uuid}   	loodle_id 	loodle indentifier
 * @param  {uuid}   	user_id   	user identifier
 * @param  {Function} 	callback  	standard callback function
 * 
 * @return {void}             		null or error message
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

}

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
}

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

				var query = 'SELECT id, email, first_name, last_name FROM users WHERE id = ?';
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

Loodle.remove = function (loodle_id, callback) {

	var query = 'DELETE FROM doodles WHERE id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, callback);

};

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

Loodle.removeSchedule = function (loodle_id, schedule_id, callback) {

	var query = 'DELETE FROM schedule_by_doodle WHERE doodle_id = ? AND schedule_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, callback);

};

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

Loodle.removeVote = function (vote_id, callback) {

	var query = 'DELETE FROM votes WHERE id = ?';
	db.execute(query
		, [ vote_id ]
		, { prepare : true }
		, callback);

};

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

Loodle.removeParticipationRequest = function (participation_request_id, callback) {

	var query = 'DELETE FROM participation_requests WHERE id = ?';
	db.execute(query
		, [ participation_request_id ]
		, { prepare : true }
		, callback);

};

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

Loodle.removeAssocationUserParticipationRequest = function (user_id, callback) {

	var query = 'DELETE FROM participation_request_by_user WHERE user_id = ?';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, callback);

};

Loodle.removeAssociationLoodleParticipationRequest = function (loodle_id, callback) {

	var query = 'DELETE FROM participation_request_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, callback);

};

Loodle.openToPublic = function (loodle_id, callback) {

	var query = 'UPDATE doodles SET category = ? WHERE id = ?';
	db.execute(query
		, [ 'public', loodle_id ]
		, { prepare : true }
		, callback);

};

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

Loodle.setCategory = function (loodle_id, category, callback) {

	var query = 'UPDATE doodles SET category = ? WHERE id = ?';
	db.execute(query
		, [ category, loodle_id ]
		, { prepare : true }
		, callback);

};


module.exports = Loodle;