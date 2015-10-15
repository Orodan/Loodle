var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var Schedule = require('../models/schedule.model');

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
		}
	}, function (err, results) {
		if (err)
			return callback(err)
		
		return callback(null, results.save);
	});

}

module.exports = ScheduleController;