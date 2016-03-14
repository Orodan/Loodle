var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

/**
 * Create a new schedule object
 *
 * @class  Schedule
 * @param {String} 	begin_time 		Schedule's begin time
 * @param {String} 	end_time   		Schedule's end time
 */
function Schedule (begin_time, end_time) {

	this.id = cassandra.types.Uuid.random();
	this.begin_time = begin_time;
	this.end_time = end_time;

}

//////////////////////////
// Prototypal functions //
//////////////////////////

/** 
 * Save the schedule in db
 * 
 * @param  {Function} callback 	Standard callback function
 */
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

};

/////////////////////////////
// Schedule model features //
/////////////////////////////

/**
 * Delete a schedule
 * 
 * @param  {uuid}   	loodle_id   	Loodle identifier
 * @param  {uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
Schedule.delete = function (schedule_id, callback) {

	var query = 'DELETE FROM schedules WHERE id = ?';
	db.execute(query
		, [ schedule_id ]
		, { prepare : true }
		, callback);

};

/**
 * Get vote ids associated with the specified schedule
 * 
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Function} 	callback    	Standard callback function
 */
Schedule.getVoteIds = function (schedule_id, loodle_id, callback) {

	var query = 'SELECT * FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ?';
	db.execute(query, [ loodle_id, schedule_id ], { prepare : true }, function (err, data) {
		if (err) return callback(err);

		var results = [];
		data.rows.forEach(function (element) {
			results.push(element.vote_id);
		});

		return callback(null, results);
	});

};

/**
 * Get schedule data
 * 
 * @param  {Uuid}   	id  		Schedule identifier
 * @param  {Function} 	callback 	Standard callback function
 */
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
	
};

/**
 * Bind the specified loodle to the schedule
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
Schedule.bindLoodle = function (loodle_id, schedule_id, callback) {

	var query = 'INSERT INTO schedule_by_doodle (doodle_id, schedule_id) values (?, ?)';

	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, callback);

};

/**
 * Remove the schedule from the specified loodle
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
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

/**
 * Delete the association between the schedule and the specified loodle
 * 
 * @param  {Uuid}   	loodleId 	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Schedule.deleteAssociationsWithLoodle = function (loodleId, callback) {

	var query = 'DELETE FROM schedule_by_doodle WHERE doodle_id = ?';
	db.execute(query, [ loodleId ], { prepare : true }, callback);

};


module.exports = Schedule;