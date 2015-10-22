var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var Notification = require('../models/notification.model');
var NotificationByEmail = require('../models/notification-by-email.model');

var Configuration = require('./configuration');

var NotificationController = {};

NotificationController.notify = function (loodle_id, current_user_id, callback) {

	// Get the user ids of the loodle minus the current user
	// For each of them get notification and notification_by_email
	// If notification --> create notification 
	// If notification_by_email --> create notification by email

	var users = [];

	async.series({

		// Get the user ids of the loodle minus the current user
		getUserIdsOfLoodle: function (done) {
			Notification.getUserIdsOfLoodle(loodle_id, function (err, data) {
				if (err)
					return done(err);

				data.forEach(function (user_id) {
					if (user_id !== current_user_id)
						users.push({
							id: user_id
						});
				});

				return done();
			});
		},

		// For each of them get notification and notification_by_email
		getConfiguration: function (done) {

			async.each(users, function (user, end) {
				Configuration.getFromUser(user.id, loodle_id, function (err, configuration) {
					if (err)
						return end(err);

					user.configuration = configuration;
					return end();
				});
			}, done);

		},

		// Send notifications
		sendNotifications: function (done) {

			async.each(users, function (user, end) {

				async.parallel({

					// Send notification if needed
					sendNotification: function (finish) {

						if (user.configuration.notification) {

							var notif = new Notification(current_user_id, loodle_id);
							notif.save(user.id, finish);
	
						}
						else
							return finish();

					},

					// Send notification by email if needed
					sendNotificationByEmail: function (finish) {

						if (user.configuration.notification_by_email) {
							
							var notif = new NotificationByEmail(current_user_id, loodle_id);
							notif.save(user_id, finish);

						}
						else
							return finish();

					}
				}, end);

			}, done);
		}

	}, function (err) {
		if (err)
			return callback(err);

		return callback();
	});

};

module.exports = NotificationController;