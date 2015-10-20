var db = require('../../config/database');
var cassandra = require('cassandra-driver');
var async = require('async');

function ParticipationRequest (loodle_id, from_id, to_id) {

	this.id = cassandra.types.Uuid.random();
	this.loodle_id = loodle_id;
	this.from_id = from_id;
	this.to_id = to_id;

}

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

ParticipationRequest.bindToLoodle = function (id, loodle_id, callback) {

	var query = 'INSERT INTO participation_request_by_doodle (doodle_id, participation_request_id) values (?, ?)';
	db.execute(query
		, [ loodle_id, id ]
		, { prepare : true }
		, callback)

};

ParticipationRequest.bindToUser = function (id, user_id, callback) {

	var query = 'INSERT INTO participation_request_by_user (user_id, participation_request_id) values (?, ?)';
	db.execute(query
		, [ user_id, id ]
		, { prepare : true }
		, callback)

};

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

module.exports = ParticipationRequest;