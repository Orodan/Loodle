var db = require('../../config/database');
var cassandra = require('cassandra-driver');
var async = require('async');

function Loodle (name, description) {
	this.id = cassandra.types.Uuid.random();
	this.name = name;
	this.description = description;
	this.created = Date.now();
	this.category = 'private';
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

			async.each(user_ids, function (user_id, end) {

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

			console.log("User ids : ", user_ids);

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
						console.log("elemet : ", element);
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

module.exports = Loodle;