	var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var cassandra = require('cassandra-driver');
var Loodle = require('../models/loodle.model');

module.exports = {

	createLoodle: function (req, res) {

		var loodle = new Loodle(req.body.name, req.body.description);
		loodle.save(function (err, data) {
			if (err)
				return error(res, err);

			return success(res, data);
		});
	},

	get: function (req, res) {

		Loodle.get(req.params.id, function (err, data) {
			if (err)
				return error(res, err);

			return success(res, data);
		});

	}
}

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