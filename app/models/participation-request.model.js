var db = require('../../config/database');
var cassandra = require('cassandra-driver');
var async = require('async');

function ParticipationRequest () {}

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

			return callback(null, data.rows);
		});
};

module.exports = ParticipationRequest;