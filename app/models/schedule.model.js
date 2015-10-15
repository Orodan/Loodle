var db = require('../../config/database');
var cassandra = require('cassandra-driver');
var async = require('async');

function Schedule (begin_time, end_time) {
	this.id = cassandra.types.Uuid.random();
	this.begin_time = begin_time;
	this.end_time = end_time;
}

Schedule.prototype.save = function (callback) {

	var self = this;

	var query = 'INSERT INTO schedules (id, begin_time, end_time) values (?, ?, ?)';
	db.execute(query
		, [ this.id, this.begin_time, this.end_time]
	    , { prepare: true }
	    , function (err) {
	    	if (err)
	    		return callback(err);

	    	Schedule.get(self.id, callback);
	    }
	);

}

Schedule.get = function (id, callback) {

	var query = 'SELECT * FROM schedules WHERE id = ?';
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

Schedule.bindLoodle = function (loodle_id, schedule_id, callback) {

	var query = 'INSERT INTO schedule_by_doodle (doodle_id, schedule_id) values (?, ?)';

	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, function (err) {
			return callback(err);
		});
};

module.exports = Schedule;