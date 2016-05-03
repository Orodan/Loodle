var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

/**
 * Create a new vote object
 *
 * @class  Vote
 * @param {Int} vote Vote value
 */
function Vote (vote) {
	this.id = cassandra.types.Uuid.random();
	this.vote = (vote) ? vote : 0;
}

//////////////////////////
// Prototypal functions //
//////////////////////////

/**
 * Save the vote in db
 * 
 * @param  {Function} callback 	Standard callback function
 */
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

};

/** 
 * Bind the vote to the specified loodle and loodle's schedule
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	user_id     	User identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
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

};

/////////////////////////
// Vote model features //
/////////////////////////

/**
 * Update the vote which match the loodle, the user and the schedule with the specified value
 *
 * @param loodleId
 * @param userId
 * @param scheduleId
 * @param value
 * @param callback
 */
Vote.updateVoteFromScheduleId = function (loodleId, userId, scheduleId, value, callback) {

	var query = 'SELECT vote_id FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ? AND schedule_id = ?';
	db.execute(query, [ loodleId, userId, scheduleId ], { prepare : true }, function (err, data) {
		if (err) return callback(err);

		Vote.update(data.rows[0].vote_id, value, callback);
	});

};

/**
 * Remove the association between a user and his/her votes on a loodle
 * 
 * @param  {uuid}   	loodle_id 	Loodle identifier
 * @param  {uuid}   	user_id   	User identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Vote.removeAssociationsWithUser = function (loodle_id, user_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, user_id ]
		, { prepare : true }
		, callback);

};

/**
 * Remove the associations between the vote and the specified schedule
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
Vote.removeAssociationsWithSchedule = function (loodle_id, schedule_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, callback);

};

/**
 * Remove the association between a vote and the specified user on the specified schedule
 * 
 * @param  {uuid}   	loodle_id   	Loodle identifier
 * @param  {uuid}   	schedule_id 	Schedule identifier
 * @param  {uuid}   	user_id     	User identifier
 * @param  {Function} 	callback    	Standard callback function
 */
Vote.removeAssociationWithScheduleByUser = function (loodle_id, schedule_id, user_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id, user_id ]
		, { prepare : true }
		, callback);

};

/**
 * Remove the assocation between a user vote and the specified schedule
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	user_id     	User identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
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
 * @param  {uuid}   	vote_id  	Vote identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Vote.delete = function (vote_id, callback) {

	var query = 'DELETE FROM votes WHERE id = ?';
	db.execute(query
		, [ vote_id ]
		, { prepare : true }
		, callback);

};

/**
 * Get vote data
 * 
 * @param  {Uuid}   	id       	Vote identifier
 * @param  {Function} 	callback 	Standard callback function
 */
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

};

/**
 * Get user ids associated with the loodle
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
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

/**
 * Get loodle's schedule ids
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
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

/**
 * Update the vote with the specified value
 * 
 * @param  {Uuid}   	id       	Vote identifier
 * @param  {Int}   		vote     	New vote value
 * @param  {Function} 	callback 	Standard callback function
 */
Vote.update = function (id, vote, callback) {

	var query = 'UPDATE votes SET vote = ? WHERE id = ?';
	db.execute(query
		, [ vote, id ]
		, { prepare : true }
		, callback);

};

/**
 * Get vote ids associated with the specified schedule
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
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

/**
 * Get vote ids associated with the specified user on the specified loodle
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Uuid}   	user_id   	Schedule identifier
 * @param  {Function} 	callback  	Standard callback function
 */
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

/**
 * Delete the vote
 * 
 * @param  {Uuid}   	vote_id  	Vote identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Vote.remove = function (vote_id, callback) {

	var query = 'DELETE FROM votes WHERE id = ?';
	db.execute(query
		, [ vote_id ]
		, { prepare : true }
		, callback);

};

/**
 * Delete the associations between a schedule and all its votes associated
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
Vote.deleteAssociationScheduleVoteBySchedule = function (loodle_id, schedule_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id ]
		, { prepare : true }
		, callback);

};

/**
 * Delete the associations between a user and all his/her votes on the specified loodle
 * 
 * @param  {Uuid}   	loodle_id 		Loodle identifier
 * @param  {Uuid}   	user_id   		User identifier
 * @param  {Function} 	callback  		Standard callback function
 */
Vote.deleteAssociationUserVoteByUser = function (loodle_id, user_id, callback) {
	
	var query = 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, user_id ]
		, { prepare : true }
		, callback);

};

/**
 * Delete the assocation between a user vote and the specified schedule
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	user_id     	User identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
Vote.deleteAssociationUserVoteBySchedule = function (loodle_id, user_id, schedule_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ? AND schedule_id = ?';
	db.execute(query
		, [  loodle_id, user_id, schedule_id ]
		, { prepare : true }
		, callback);

};

/**
 * Delete the association between a vote and the specified user on the specified schedule
 * 
 * @param  {uuid}   	loodle_id   	Loodle identifier
 * @param  {uuid}   	schedule_id 	Schedule identifier
 * @param  {uuid}   	user_id     	User identifier
 * @param  {Function} 	callback    	Standard callback function
 */
Vote.deleteAssociationScheduleVoteByUser = function (loodle_id, schedule_id, user_id, callback) {

	var query = 'DELETE FROM vote_by_doodle_and_schedule WHERE doodle_id = ? AND schedule_id = ? AND user_id = ?';
	db.execute(query
		, [ loodle_id, schedule_id, user_id ]
		, { prepare : true }
		, callback);

};

/**
 * Delete associations between a loodle and its votes
 * 
 * @param  {Uuid}   	loodleId 	Loodle identifier
 * @param  {Function} 	callback 	Standard callback function
 */
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