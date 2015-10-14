var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var cassandra = require('cassandra-driver');
var Loodle = require('../models/loodle.model');

module.exports = {

	createLoodle: function (user_id, name, description, callback) {

		var loodle = new Loodle(name, description);
		async.parallel({
			// Save the loodle
			save: function (done) {
				loodle.save(done);
			},
			// Associate the loodle and the user
			bind: function (done) {
				Loodle.bindUser(user_id, loodle.id, done)
			}
		}, function (err, results) {

			if (err)
				return callback(err)
			
			return callback(null, results.save);

		});
	},

	get: function (req, res) {

		Loodle.get(req.params.id, function (err, data) {
			if (err)
				return error(res, err);

			return success(res, data);
		});

	},

	getLoodlesOfUser: function (req, res) {

		console.log("req.user.id : ", req.user.id);

		async.waterfall([
			// Get the loodles id 
			function (done) {
				Loodle.getLoodleIdsOfUser(req.user.id, done);
			},
			// Get the loodles data 
			function (loodle_ids, done) {
				var results = [];

				async.each(loodle_ids, function (loodle_id, end) {

					Loodle.get(loodle_id, function (err, data) {
						if (err)
							return end(err);

						results.push(data);
						return end();
					})
				}, function (err) {
					return done(err, results);
				});
			}
		], function (err, data) {
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