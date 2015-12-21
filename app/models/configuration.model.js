var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

function Configuration (user_id, loodle_id, notification, notification_by_email, role) {
	this.user_id = user_id;
	this.loodle_id = loodle_id;
	this.notification = (notification) ? notification : false
	this.notification_by_email = (notification_by_email) ? notification_by_email : false
	this.role = (role) ? role : 'user';
}

Configuration.delete = function (user_id, loodle_id, callback) {

	var query = 'DELETE FROM configuration_by_user_and_doodle WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ user_id, loodle_id ]
		, { prepare : true },
		callback);
	
}

Configuration.prototype.save = function (callback) {

	var query = 'INSERT INTO configuration_by_user_and_doodle (user_id, doodle_id, notification, notification_by_email, role) values (?, ?, ?, ?, ?)';
	db.execute(query
		, [ this.user_id, this.loodle_id, this.notification, this.notification_by_email, this.role ]
		, { prepare : true }
		, callback);

};

Configuration.get = function (user_id, loodle_id, callback) {

	var query = 'SELECT * FROM configuration_by_user_and_doodle WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ user_id, loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		});

};

Configuration.update = function (user_id, loodle_id, notification, notification_by_email, callback) {

	// We are forced to insert notifications config value this way,
	// otherwise cassandra change it to true no matter what
	var query = 'UPDATE configuration_by_user_and_doodle SET notification = ' + notification  + ', notification_by_email = ' + notification_by_email + ' WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ user_id, loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			Configuration.get(user_id, loodle_id, callback);
		});

};

Configuration.getFromUser = function (user_id, loodle_id, callback) {

	var query = 'SELECT * FROM configuration_by_user_and_doodle WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ user_id, loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		});

};

Configuration.setUserRole = function (user_id, doodle_id, role, callback) {

	var query = 'UPDATE configuration_by_user_and_doodle SET role = ? WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ role, user_id, doodle_id ]
		, { prepare : true }
		, callback);

};

Configuration.getUserIds = function (loodle_id, callback) {

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
		});

};

Configuration.getUser = function (user_id, callback) {

	var query = 'SELECT id, email, first_name, last_name, status FROM users WHERE id = ?';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		})

};

Configuration.getUserRole = function (user_id, loodle_id, callback) {

	var query = 'SELECT role FROM configuration_by_user_and_doodle WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ user_id, loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0].role);
		});

};

Configuration.updateUserRole = function (user_id, loodle_id, role, callback) {

	var query = 'UPDATE configuration_by_user_and_doodle SET role = ? WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ role, user_id, loodle_id ]
		, { prepare : true }
		, callback); 

};

Configuration.delete = function (user_id, loodle_id, callback) {

	var query = 'DELETE FROM configuration_by_user_and_doodle WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ user_id, loodle_id ]
		, { prepare : true }
		, callback);

};

module.exports = Configuration;