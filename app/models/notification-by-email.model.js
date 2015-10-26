var db = require('../../config/database');
var cassandra = require('cassandra-driver');
var async = require('async');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: 'jimmyk.dsi@gmail.com',
		pass: 'fantasydsi17'
	}
});

var NotificationByEmail = {};

NotificationByEmail.send = function (from_id, to_id, loodle_id, callback) {

	// Get sender data
	// Get receiver data
	// Get loodle data
	// Send mail

	async.parallel({
		// Get sender data
		sender: function (done) {
			NotificationByEmail.getUser(from_id, done);
		},

		// Get receiver data
		receiver: function (done) {
			NotificationByEmail.getUser(to_id, done);
		},

		// Get loodle data
		loodle: function (done) {
			NotificationByEmail.getLoodle(loodle_id, done);
		}
	}, function (err, results) {
		if (err)
			return callback(err);

		// Define the content
		var content = '<h3>' + results.loodle.name + '</h3><br/><p>Hello' + 
		'<strong> ' + results.receiver.first_name + ' ' + results.receiver.last_name + 
		'</strong>' + '</p><p><strong>' + results.sender.first_name +
		' ' + results.sender.last_name + '</strong> updated his/her votes';

		// Define the mail options
		var mailOptions = {
			from: 'Loodle app <loodle@univ-lr.com>',
			to: results.receiver.email,
			subject: 'Vote update',
			html: content
		}

		// Send the mail
		transporter.sendMail(mailOptions);

		return callback();
	});

};

NotificationByEmail.getUser = function (user_id, callback) {

	var query = 'SELECT * FROM users WHERE id = ?';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		});

};

NotificationByEmail.getLoodle = function (loodle_id, callback) {

	var query = 'SELECT * FROM doodles WHERE id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		});

};

module.exports = NotificationByEmail;