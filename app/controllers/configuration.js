var async         = require('async');
var bcrypt        = require('bcrypt-nodejs');
var Configuration = require('../models/configuration.model');

var ConfigurationController = {};

/////////////////
// Route calls //
/////////////////

/**
 * Route call to get configuration data
 * 
 * @param  {Object} 	req 	Incoming request
 * @param  {Object} 	res 	Response to send
 */
ConfigurationController._get = function (req, res) {

	Configuration.get(req.user.id, req.params.id, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

/**
 * Update the configuration
 * 
 * @param  {Object} 	req 	Incoming request
 * @param  {Object} 	res 	Response to send
 */
ConfigurationController._update = function (req, res) {

	Configuration.update(req.user.id, req.params.id, req.body.notification, req.body.notification_by_email, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

/**
 * Update the roles of the specified users in the loodle
 * 
 * @param  {Object} 	req 	Incoming request
 * @param  {Object} 	res 	Response to send
 */
ConfigurationController._updateUserRoles = function (req, res) {

	async.each(req.body.users, function (user, callback) {
		Configuration.updateUserRole(user.id, req.params.id, user.role, callback);
	}, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'User roles updated');
	});

};

///////////////////////////////////////
// Configuration Controller Features //
///////////////////////////////////////

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