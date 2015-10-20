var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var ParticipationRequest = require('../models/participation-request.model');

var ParticipationRequestController = {};

ParticipationRequestController.getParticipationRequestsOfUser = function (req, res) {

	var results = [];

	async.waterfall([
		// Get participation requests ids of the user
		function (done) {
			ParticipationRequest.getIdsFromUser(req.user.id, done);
		},
		// Get participation requests data
		function (participation_request_ids, done) {

			async.each(participation_request_ids, function (pr_id, end) {
				ParticipationRequest.get(pr_id, function (err, data) {
					if (err)
						return end(err);

					results.push(data);
					return end();
				})
			}, done);
		}
	], function (err) {
		if (err)
			return error(res, err);

		return success(res, results);
	});

};

module.exports = ParticipationRequestController;

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