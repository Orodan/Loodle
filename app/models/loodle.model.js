var db = require('../../config/database');
var cassandra = require('cassandra-driver');

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

Loodle.get = function (id, callback) {

	var query = 'SELECT * FROM doodles WHERE id = ?';
	db.execute(query
		, [ id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			if (data.rows.length === 0)
				return callback(null, {});

			return callback(null, data.rows[0]);
		}
	);

}

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

}

Loodle.bindUser = function(loodle_id, user_id, callback) {

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
		, callback
	);

}

module.exports = Loodle;