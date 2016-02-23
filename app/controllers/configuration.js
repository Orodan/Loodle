var async         = require('async');
var bcrypt        = require('bcrypt-nodejs');
var Configuration = require('../models/configuration.model');

var ConfigurationController = {};

/////////////////
// Route calls //
/////////////////

/**
 * Get configuration data
 * 
 * @param  {Object} 	req 	Incoming request
 * @param  {Object} 	res 	Response to send
 */
ConfigurationController.get = function (req, res) {

	Configuration.get(req.user.id, req.params.id, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

/**
 * Update the configuration
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
ConfigurationController.update = function (req, res) {

	Configuration.update(req.user.id, req.params.id, req.body.notification, req.body.notification_by_email, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

/**
 * Get users of the loodle with a role
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
ConfigurationController.getUsersWithRole = function (req, res) {

	async.waterfall([

		// Get user ids
		function (done) {
			Configuration.getUserIds(req.params.id, done);
		},

		// Get users data
		function (user_ids, done) {

			var users = [];

			async.each(user_ids, function (user_id, end) {

				Configuration.getUser(user_id, function (err, user) {
					if (err)
						return end(err);

					// Only get the users registred
					if (user.status == 'registred')
						users.push(user);
					
					return end();
				});

			}, function (err) {
				if (err)
					return done(err);

				return done(null, users);
			});

		},

		// Get users role
		function (users, done) {

			var results = [];

			async.each(users, function (user, end) {

				Configuration.getUserRole(user.id, req.params.id, function (err, role) {
					if (err)
						return end(err);

					user.role = role;
					return end();
				});

			}, function (err) {
				if (err)
					return done(err);

				return done(null, users);
			});

		}

	], function (err, users) {

		if (err)
			return error(res, err);

		return success(res, users);
	});

};

/**
 * Update the roles of the specified users in the loodle
 * 
 * @param  {Object} 	req 	Incomming request
 * @param  {Object} 	res 	Response to send
 */
ConfigurationController.updateUserRoles = function (req, res) {

	async.each(req.body.users, function (user, callback) {
		Configuration.updateUserRole(user.id, req.params.id, user.role, callback);
	}, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'User roles updated');
	});

};

//////////////
// Features //
//////////////

/**
 * Delete configuration
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
ConfigurationController.delete = function (user_id, loodle_id, callback) {

	Configuration.delete(user_id, loodle_id, callback);

};

/**
 * Create a default configuration for an user
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
ConfigurationController.createDefaultConfiguration = function (user_id, loodle_id, callback) {

	var config = new Configuration(user_id, loodle_id);
	config.save(callback);

};

/**
 * Get the user configuration for the specified loodle
 * 
 * @param  {Uuid}   	user_id   	User identifier
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
ConfigurationController.getUserConfiguration = function (user_id, loodle_id, callback) {

	Configuration.get(user_id, loodle_id, callback);

};

/**
 * Set the user role for the specified loodle
 * 
 * @param {Uuid}   		user_id   	User identifier
 * @param {Uuid}   		doodle_id 	Loodle identifier
 * @param {String}   	role      	Role to set the user
 * @param {Function} callback  		Standard callback function
 */
ConfigurationController.setUserRole = function (user_id, doodle_id, role, callback) {

	Configuration.setUserRole(user_id, doodle_id, role, callback);

};

module.exports = ConfigurationController;

function error(res, err) {
	res.status(500);
	res.json({
		type: false,
		data: err
	});
};

function success(res, data) {
	res.json({
		type: true,
		data: data
	});
};