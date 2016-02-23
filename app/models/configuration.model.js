var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

/**
 * Create a new configuration object
 * @param {Uuid} 	user_id               	User identifier
 * @param {Uuid} 	loodle_id             	Loodle identifier
 * @param {String} 	notification          	Notification configuration value
 * @param {String} 	notification_by_email 	Notification by email configuration value
 * @param {String} 	role                  	User role configuration value
 */
function Configuration (user_id, loodle_id, notification, notification_by_email, role) {

	this.user_id = user_id;
	this.loodle_id = loodle_id;
	this.notification = (notification) ? notification : false
	this.notification_by_email = (notification_by_email) ? notification_by_email : false
	this.role = (role) ? role : 'user';

}

//////////////////////////
// Prototypal functions //
//////////////////////////

/**
 * Save the configuration in db
 * 
 * @param  {Function} callback Standard callback function
 */
Configuration.prototype.save = function (callback) {

	var query = 'INSERT INTO configuration_by_user_and_doodle (user_id, doodle_id, notification, notification_by_email, role) values (?, ?, ?, ?, ?)';
	db.execute(query
		, [ this.user_id, this.loodle_id, this.notification, this.notification_by_email, this.role ]
		, { prepare : true }
		, callback);

};

//////////////////////////////////
// Configuration Model Features //
//////////////////////////////////

/**
 * Get the configuration of the user on the specified loodle
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
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

/**
 * Delete the configuration
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Configuration.delete = function (user_id, loodle_id, callback) {

	var query = 'DELETE FROM configuration_by_user_and_doodle WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ user_id, loodle_id ]
		, { prepare : true },
		callback);
	
};

/**
 * Update the configuration
 * 
 * @param  {Uuid}   	user_id               	User identifier
 * @param  {Uuid}   	loodle_id             	Loodle identifier
 * @param  {String}   	notification          	Notification configuration value
 * @param  {String}   	notification_by_email 	Notification by email configuration value
 * @param  {Function} 	callback              	Standard callback function
 */
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

/**
 * Set the user's role on the specified loodle
 * 
 * @param {Uuid}   		user_id   	User identifier
 * @param {Uuid}   		doodle_id 	Loodle identifier
 * @param {String}   	role      	New user's role
 * @param {Function} 	callback  	Standard callback function
 */
Configuration.setUserRole = function (user_id, doodle_id, role, callback) {

	var query = 'UPDATE configuration_by_user_and_doodle SET role = ? WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ role, user_id, doodle_id ]
		, { prepare : true }
		, callback);

};

/**
 * Get the user's role on the specified loodle
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
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

/**
 * Update the user's role on the specified loodle
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {String}   	role      	New user's role
 * @param  {Function} callback  	Standard callback function
 */
Configuration.updateUserRole = function (user_id, loodle_id, role, callback) {

	var query = 'UPDATE configuration_by_user_and_doodle SET role = ? WHERE user_id = ? AND doodle_id = ?';
	db.execute(query
		, [ role, user_id, loodle_id ]
		, { prepare : true }
		, callback); 

};

module.exports = Configuration;