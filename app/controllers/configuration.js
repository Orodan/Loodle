var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var Configuration = require('../models/configuration.model');

var ConfigurationController = {};

// Get configuration data
ConfigurationController.get = function (req, res) {

	Configuration.get(req.user.id, req.params.id, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

ConfigurationController.update = function (req, res) {

	Configuration.update(req.user.id, req.params.id, req.body.notification, req.body.notification_by_email, function (err, data) {
		if (err)
			return error(res, err);

		return success(res, data);
	});

};

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