var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var Schedule = require('../models/schedule.model');

var Vote = require('../controllers/vote');

var ScheduleController = {};

// Create the schedule and bind it to the loodle
ScheduleController.createSchedule = function (loodle_id, begin_time, end_time, callback) {

	var schedule = new Schedule(begin_time, end_time);

	async.parallel({
		// Save the schedule
		save: function (done) {
			schedule.save(done);
		},
		// Bind the schedule to the loodle
		bind: function (done) {
			Schedule.bindLoodle(loodle_id, schedule.id, done);
		},
		// Create the default vote for this schedule
		defaultVotes: function (done) {
			Vote.createVotesForSchedule(loodle_id, schedule.id, done);
		}
	}, function (err, results) {
		if (err)
			return callback(err)
		
		return callback(null, results.save);
	});
}

ScheduleController.remove = function (loodle_id, schedule_id, callback) {

	async.parallel({
		// Delete the schedule and its association with the loodle
		deleteSchedule: function (done) {
			Schedule.remove(loodle_id, schedule_id, done);
		},
		// Delete the votes associated for each user of the loodle
		deleteVotes: function (done) {
			Vote.deleteVotesFromSchedule(loodle_id, schedule_id, done);
		}
	}, callback);

};

module.exports = ScheduleController;