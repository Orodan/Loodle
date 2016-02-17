var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

function Vote (vote) {
	this.id = cassandra.types.Uuid.random();
	this.vote = (vote) ? vote : 0;
}

/**
 * Remove the association between a user and his/her votes on a loodle
 * 
 * @param  {uuid}   	loodle_id 	loodle identifier
 * @param  {uuid}   	user_id   	user identifier
 * @param  {Function} 	callback  	standard callback function
 * 
 * @return {void}             		null or error message
 */
Vote.removeAssociationsWithUser = function (loodle_id, user_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, user_id ]
		, { prepare : true }
		, callback);

};

Vote.removeAssociationsWithSchedule = function (loodle_id, schedule_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, callback);

};

/**
 * Remove the association between a vote of a user and a schedule on a loodle
 * 
 * @param  {uuid}   	loodle_id   	loodle identifier
 * @param  {uuid}   	schedule_id 	schedule identifier
 * @param  {uuid}   	user_id     	user identifier
 * @param  {Function} 	callback    	standard callback function
 * 
 * @return {void}               		null or error message
 */
Vote.removeAssociationWithScheduleByUser = function (loodle_id, schedule_id, user_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id, user_id ]
		, { prepare : true }
		, callback);

};

Vote.removeAssociationWithUserBySchedule = function (loodle_id, user_id, schedule_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ? AND schedule_id = ?';
	db.execute(query
		, [ loodle_id, user_id, schedule_id ]
		, { prepare : true }
		, callback);

};

/**
 * Delete a vote
 * 
 * @param  {uuid}   	vote_id  	vote identifier
 * @param  {Function} 	callback 	standard callback function
 * 
 * @return {void}            		null or error message
 */
Vote.delete = function (vote_id, callback) {

	var query = 'DELETE FROM votes WHERE id = ?';
	db.execute(query
		, [ vote_id ]
		, { prepare : true }
		, callback);

};

Vote.prototype.save = function (callback) {

	var self = this;

	var query = 'INSERT INTO votes (id, vote) values (?, ?)';
	db.execute(query
		, [ this.id, this.vote ]
	    , { prepare: true }
	    , function (err) {
	    	if (err)
	    		return callback(err);

	    	Vote.get(self.id, callback);
	    }
	);

}

Vote.prototype.bind = function (loodle_id, user_id, schedule_id, callback) {

	var queries = [
		{
			query: 'INSERT INTO vote_by_doodle_and_schedule (doodle_id, schedule_id, user_id, vote_id) values (?, ?, ?, ?)',
			params: [ loodle_id, schedule_id, user_id, this.id ]
		},
		{
			query: 'INSERT INTO vote_by_doodle_and_user (doodle_id, user_id, schedule_id, vote_id) values (?, ?, ?, ?)',
			params: [ loodle_id, user_id, schedule_id, this.id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, callback);

}

Vote.get = function (id, callback) {

	var query = 'SELECT * FROM votes WHERE id = ?';
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

Vote.getUserIdsOfLoodle = function (loodle_id, callback) {

	var query = 'SELECT user_id FROM user_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
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

Vote.getScheduleIds = function (loodle_id, callback) {

	var query = 'SELECT schedule_id FROM schedule_by_doodle WHERE doodle_id = ?';

	db.execute(query, 
		[ loodle_id ], 
		{ prepare : true }, 
		function (err, data) {
			if (err)
				return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
				results.push(element.schedule_id);
			});

			return callback(null, results);
		}
	);

};

Vote.update = function (id, vote, callback) {

	var query = 'UPDATE votes SET vote = ? WHERE id = ?';
	db.execute(query
		, [ vote, id ]
		, { prepare : true }
		, callback);

};

Vote.getVoteIdsFromSchedule = function (loodle_id, schedule_id, callback) {

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

Vote.getVoteIdsFromUser = function (loodle_id, user_id, callback) {

	var query = 'SELECT vote_id FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, user_id ]
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

Vote.remove = function (vote_id, callback) {

	var query = 'DELETE FROM votes WHERE id = ?';
	db.execute(query
		, [ vote_id ]
		, { prepare : true }
		, callback);

};

Vote.deleteAssociationScheduleVoteBySchedule = function (loodle_id, schedule_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, callback);

};

Vote.deleteAssociationUserVoteByUser = function (loodle_id, user_id, callback) {
	
	var query = 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, user_id ]
		, { prepare : true }
		, callback);

};

Vote.deleteAssociationUserVoteBySchedule = function (loodle_id, user_id, schedule_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ? AND schedule_id = ?';
	db.execute(query
		, [  loodle_id, user_id, schedule_id ]
		, { prepare : true }
		, callback);

};

Vote.deleteAssociationScheduleVoteByUser = function (loodle_id, schedule_id, user_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id, user_id ]
		, { prepare : true }
		, callback);

};

Vote.deleteAssociationsWithLoodle = function (loodleId, callback) {

	var queries = [
		{
			query: 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ?',
			params: [ loodleId ]
		},
		{
			query: 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ?',
			params: [ loodleId ]
		}
	];

	db.batch(queries, { prepare: true }, callback);

};

module.exports = Vote;