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

			return callback(null, data.rows);
		}
	);

}

module.exports = Loodle;