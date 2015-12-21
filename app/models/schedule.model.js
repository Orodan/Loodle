var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

function Schedule (begin_time, end_time) {
	this.id = cassandra.types.Uuid.random();
	this.begin_time = begin_time;
	this.end_time = end_time;
}

/**
 * Delete a schedule
 * 
 * @param  {uuid}   	loodle_id   	loodle identifier
 * @param  {uuid}   	schedule_id 	schedule identifier
 * @param  {Function} 	callback    	standard callback function
 * 
 * @return {void}               		null or error message
 */
Schedule.delete = function (schedule_id, callback) {

	var query = 'DELETE FROM schedules WHERE id = ?';
	db.execute(query
		, [ schedule_id ]
		, { prepare : true }
		, callback);

};

Schedule.getVoteIds = function (schedule_id, loodle_id, callback) {

	var query = 'SELECT vote_id FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, function (err, data) {

			if (err)
			    return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
			    results.push(element.vote_id);
			});

			return callback(null, results);

		});

};

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
		, callback);
};

Schedule.remove = function (loodle_id, schedule_id, callback) {

	var queries = [
		{
			query: 'DELETE FROM schedules WHERE id = ?',
			params: [ schedule_id ]
		},
		{
			query: 'DELETE FROM schedule_by_doodle WHERE doodle_id = ? AND schedule_id = ?',
			params: [ loodle_id, schedule_id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, callback);

};

Schedule.removeAssociation = function (loodle_id, schedule_id, callback) {

	var query = 'DELETE FROM schedule_by'

};

module.exports = Schedule;