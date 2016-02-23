var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

var Vote      = require('./vote.model');

/**
 * Create a new participation request object
 * 
 * @param {Uuid} 	loodle_id 	Loodle identifier
 * @param {Uuid} 	from_id   	User identifier who emited the participation request
 * @param {[type]} 	to_id     	User identifier who will received the partcipation request
 */
function ParticipationRequest (loodle_id, from_id, to_id) {

	this.id = cassandra.types.Uuid.random();
	this.loodle_id = loodle_id;
	this.from_id = from_id;
	this.to_id = to_id;

}

//////////////////////////
// Prototypal functions //
//////////////////////////

/**
 * Save the participation request in db
 * 
 * @param  {Function} callback 	Standard callback function
 */
ParticipationRequest.prototype.save = function (callback) {

	var self = this;

	var query = 'INSERT INTO participation_requests (id, doodle_id, from_id, to_id) values (?, ?, ?, ?)';
	db.execute(query
		, [ this.id, this.loodle_id, this.from_id, this.to_id ]
		, { prepare : true }
		, function (err) {
			if (err)
				return callback(err);

			return callback(null, self);
		});

};

//////////////////////////////////////////
// Participation request model features //
//////////////////////////////////////////

/**
 * Bind the participation request to the loodle
 * 
 * @param  {Uuid}   	id        	Participation request identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
ParticipationRequest.bindToLoodle = function (id, loodle_id, callback) {

	var query = 'INSERT INTO participation_request_by_doodle (doodle_id, participation_request_id) values (?, ?)';
	db.execute(query
		, [ loodle_id, id ]
		, { prepare : true }
		, callback)

};

/**
 * Bind the participation request to the user
 * 
 * @param  {Uuid}   	id       	Participation request identifier
 * @param  {Uuid}   	user_id  	User identifier
 * @param  {Function} 	callback 	Standard callback function
 */
ParticipationRequest.bindToUser = function (id, user_id, callback) {

	var query = 'INSERT INTO participation_request_by_user (user_id, participation_request_id) values (?, ?)';
	db.execute(query
		, [ user_id, id ]
		, { prepare : true }
		, callback)

};

/**
 * Get the participation request data
 * 
 * @param  {Uuid}   	id       	Participation request identifier
 * @param  {Function} 	callback 	Standard callback function
 */
ParticipationRequest.get = function (id, callback) {

	var query = 'SELECT * FROM participation_requests WHERE id = ?';
	db.execute(query
		, [ id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		});

};

/**
 * Get user's participation requests identifier
 * 
 * @param  {Uuid}   	user_id  	User identifier
 * @param  {Function} 	callback 	Standard callback function
 */
ParticipationRequest.getIdsFromUser = function (user_id, callback) {

	var query = 'SELECT participation_request_id FROM participation_request_by_user WHERE user_id = ?';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			var results = [];

			data.rows.forEach(function (element) {
				results.push(element.participation_request_id);
			})

			return callback(null, results);
		});

};

/**
 * Get loodle's participation requests identifier
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
ParticipationRequest.getIdsFromLoodle = function (loodle_id, callback) {

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
			})

			return callback(null, results);
		});

};

/**
 * Get user identifier from his/her email
 * 
 * @param  {String}   	email    	Email identifier
 * @param  {Function} 	callback 	Standard callback function
 */
ParticipationRequest.getUserIdFromEmail = function (email, callback) {

	var query = 'SELECT user_id FROM user_by_email WHERE email = ?';
	db.execute(query
		, [ email ]
		, { prepare : true }
		, function (err, result) {
			if (err) 
				return callback(err);

			if (result.rows.length === 0)
				return callback('No user with this email');

			return callback(null, result.rows[0].user_id);
		})

};

/**
 * Get user data
 * 
 * @param  {Uuid}   	user_id  	User identifier
 * @param  {Function} 	callback 	Standard callback function
 */
ParticipationRequest.getUserData = function (user_id, callback) {

	var query = 'SELECT id, email, first_name, last_name FROM users WHERE id = ?';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, function (err, result) {
			if (err)
				return callback(err);

			return callback(null, result.rows[0]);
		});

};

/**
 * Get loodle data
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
ParticipationRequest.getLoodleData = function (loodle_id, callback) {

	var query = 'SELECT * FROM doodles WHERE id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, result) {
			if (err)
				return callback(err);

			return callback(null, result.rows[0]);
		});

};

/**
 * Give the user access to the loodle
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
ParticipationRequest.giveAcess = function (user_id, loodle_id, callback) {

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
		, callback);

};

/**
 * Get loodle's schedules identifier
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
ParticipationRequest.getScheduleIds = function (loodle_id, callback) {

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
 * Create default vote the user, about the specified schedule on the specified loodle
 * 
 * @param  {Uuid}   	loodle_id   	Loodle identifier
 * @param  {Uuid}   	user_id     	User identifier
 * @param  {Uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
ParticipationRequest.createDefaultVote = function (loodle_id, user_id, schedule_id, callback) {

	var defaultVoteValue = 0;

	var vote = new Vote(defaultVoteValue);
	async.parallel({
		save: function (done) {
			vote.save(done);
		},
		bind: function (done) {
			vote.bind(loodle_id, user_id, schedule_id, done);
		}
	}, callback);

};

/**
 * Remove the participation request
 * 
 * @param  {Uuid}   participation_request_id 	Participation request identifier
 * @param  {Uuid}   loodle_id                	Loodle identifier
 * @param  {Uuid}   user_id                  	User identifier
 * @param  {Function} callback                 	Standard callback function
 */
ParticipationRequest.remove = function (participation_request_id, loodle_id, user_id, callback) {

	var queries = [
		{
			query: 'DELETE FROM participation_requests WHERE id = ?',
			params: [ participation_request_id ]
		},
		{
			query: 'DELETE FROM participation_request_by_user WHERE user_id = ?',
			params: [ user_id ]
		},
		{
			query: 'DELETE FROM participation_request_by_doodle WHERE doodle_id = ?',
			params: [ loodle_id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, callback)

};

/**
 * Delete the participation request
 * 
 * @param  {String}   prId     	Participation request identifier
 * @param  {Function} callback 	Standard callbck function
 */
ParticipationRequest.delete = function (prId, callback) {

	var query = 'DELETE FROM participation_requests WHERE id = ?';
	db.execute(query, [ prId ], { prepare : true }, callback);

};

/**
 * Delete the assocations between the loodle and it's participation requests
 * 
 * @param  {String}   loodleId 	Loodle identifier
 * @param  {Function} callback 	Standard callback function
 */
ParticipationRequest.deleteAssociationsWithLoodle = function (loodleId, callback) {

	var query = 'DELETE FROM participation_request_by_doodle WHERE doodle_id = ?';
	db.execute(query, [ loodleId ], { prepare : true }, callback);

};

/**
 * Delete the assocation between the users and theirs participation requests
 * 
 * @param  {Array}   	participationRequests 		Participation requests array
 * @param  {Function} 	callback              	Standard callback function
 */
ParticipationRequest.deleteAssociationsWithUsers = function (participationRequests, callback) {

	async.each(participationRequests, function (participationRequest, done) {
		ParticipationRequest.deleteAssociationWithUser(participationRequest.to_id, participationRequest.id, done);
	}, callback);

};

/**
 * Delete the assocation between the user and his/her participation request
 * 
 * @param  {String}   userId   		User identifier
 * @param  {String}   prId     		Participation request identifier
 * @param  {Function} callback 		Standard callback function
 */
ParticipationRequest.deleteAssociationWithUser = function (userId, prId, callback) {

	var query = 'DELETE FROM participation_request_by_user WHERE user_id = ? AND participation_request_id = ?';
	db.execute(query, [ userId, prId ], { prepare : true }, callback);

};


module.exports = ParticipationRequest;