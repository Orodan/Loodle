var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

function PublicUser (first_name, last_name) {

	this.id = cassandra.types.Uuid.random();
    this.first_name = first_name;
    this.last_name = last_name;
    this.status = 'temporary';

}

PublicUser.prototype.save = function (callback) {

	var query = 'INSERT INTO users (id, first_name, last_name, status) values (?, ?, ?, ?)';
	db.execute(query
		, [ this.id, this.first_name, this.last_name, this.status ]
		, { prepare : true }
		, callback);

};

PublicUser.bind = function (user_id, loodle_id, callback) {

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
		, { params : true }
		, callback);

};

module.exports = PublicUser;