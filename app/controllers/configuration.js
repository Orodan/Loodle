var async         = require('async');
var bcrypt        = require('bcrypt-nodejs');
var Configuration = require('../models/configuration.model');

var ConfigurationController = {};

ConfigurationController.createDefaultConfiguration = function (user_id, loodle_id, callback) {

	var config = new Configuration(user_id, loodle_id);
	config.save(callback);

};

// Get configuration data
ConfigurationController.get = function (req, res) {

	Configuration.get(req.user.id, req.params.id, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

ConfigurationController.getUserConfiguration = function (user_id, loodle_id, callback) {
	Configuration.get(user_id, loodle_id, callback);
};

ConfigurationController.update = function (req, res) {

	Configuration.update(req.user.id, req.params.id, req.body.notification, req.body.notification_by_email, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

ConfigurationController.getFromUser = function (user_id, loodle_id, callback) {

	Configuration.getFromUser(user_id, loodle_id, callback);
	
};

ConfigurationController.setUserRole = function (user_id, doodle_id, role, callback) {

	console.log('ConfigurationController.setUserRole');
	console.log('role : ', role);

	Configuration.setUserRole(user_id, doodle_id, role, callback);
};

ConfigurationController.getUsersWithRole = function (req, res) {

	// Get user ids
	// Get users role (only the registred users)
	// Get configuration

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

ConfigurationController.updateUserRoles = function (req, res) {

	console.log('ConfigurationController.updateUserRoles');
	console.log('req.body.users : ', req.body.users);

	async.each(req.body.users, function (user, callback) {
		Configuration.updateUserRole(user.id, req.params.id, user.role, callback);
	}, function (err) {
		if (err)
			return error(res, err);

		return success(res, 'User roles updated');
	});

};

ConfigurationController.delete = function (user_id, loodle_id, callback) {
	Configuration.delete(user_id, loodle_id, callback);
}

module.exports = ConfigurationController;

function error(res, err) {
	res.status(500);
	res.json({
		type: false,
		data: 'An error occured : ' + err
	});
};

function success(res, data) {
	res.json({
		type: true,
		data: data
	});
};