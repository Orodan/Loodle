var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var cassandra = require('cassandra-driver');
var Loodle = require('../models/loodle.model');

module.exports = {

	createLoodle: function (req, res) {

		var loodle = new Loodle(req.body.name, req.body.description);

		async.series({

			saveLoodle: function (done) {
				loodle.save(done);
			},

			bindLoodleAndUser: function (done) {
				Loodle.bindUser(loodle.id, req.user.id, done);
			}

		}, function (err, data) {

			if (err)
				return error(res, err);

			return success(res, data.saveLoodle);

		});

		
	},

	get: function (req, res) {

		console.log('id : ', req.params.id);

		Loodle.get(req.params.id, function (err, data) {
			if (err)
				return error(res, err);

			return success(res, data);
		});

	},

	getLoodlesOfUser: function (req, res) {

		console.log("User : ", req.user);

		async.waterfall([

			function (done) {
				Loodle.getLoodleIdsOfUser(req.user.id, done);
			},

			function (loodle_ids, done) {

				var results = [];

				console.log("Loodle ids : ", loodle_ids);

				async.each(loodle_ids, function (loodle_id, done) {

					Loodle.get(loodle_id, function (err, data) {
						results.push(data);
						return done();
					});

				}, function (err) {
					if (err)
						return error(res, err);

					return done(null, results);
				});
			}
		], function (err, results) {

			if (err)
				return error(res, err);

			return success(res, results);
		});

	}
}

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