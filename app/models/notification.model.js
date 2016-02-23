var db        = require('../../config/database');
var cassandra = require('cassandra-driver');
var async     = require('async');

/** 
 * Create a new notification object
 * 
 * @param {Uuid} 	from_id   	User identifier who emited the notification
 * @param {Uuid} 	loodle_id 	Loodle identifier
 */
function Notification (from_id, loodle_id) {

	this.id = cassandra.types.Uuid.random();
	this.from_id = from_id;
	this.doodle_id = loodle_id;
	this.is_read = false;

}

//////////////////////////
// Prototypal functions //
//////////////////////////

/**
 * Save the notification in db
 * 
 * @param  {Uuid}   	user_id  	User identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Notification.prototype.save = function (user_id, callback) {

	var queries = [
		{
			query: 'INSERT INTO notifications (id, from_id, doodle_id, is_read) values (?, ?, ?, ?)',
			params: [ this.id, this.from_id, this.doodle_id, this.is_read ]
		},
		{
			query: 'INSERT INTO notification_by_user (user_id, notification_id) values (?, ?)',
			params: [ user_id, this.id ]
		},
		{
			query: 'INSERT INTO notification_by_doodle (doodle_id, notification_id) values (?, ?)',
			params: [ this.doodle_id, this.id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, callback);

};

/////////////////////////////////
// Notification model featutes //
/////////////////////////////////

/**
 * Get notification data
 * 
 * @param  {Uuid}   	notification_id 	Notification identifier
 * @param  {Function} 	callback        	Standard callback function
 */
Notification.get = function (notification_id, callback) {

	var query = 'SELECT * FROM notifications WHERE id = ?';
	db.execute(query
		, [ notification_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		});

};

/**
 * Get user data
 * 
 * @param  {Uuid}   	user_id  	User identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Notification.getUser = function (user_id, callback) {

	var query = 'SELECT id, email, first_name, last_name FROM users WHERE id = ?';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		})

};

/**
 * Get loodle data
 * 
 * @param  {Uui}   		loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Notification.getLoodle = function (loodle_id, callback) {

	var query = 'SELECT * FROM doodles WHERE id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			return callback(null, data.rows[0]);
		})

};

/**
 * Get loodle's user ids
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Notification.getUserIdsOfLoodle = function (loodle_id, callback) {

	var query = 'SELECT user_id FROM user_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			var results = [];
			data.rows.forEach(function (element) {
				results.push(element.user_id);
			});

			return callback(null, results);
		});

};

/**
 * Get loodle's user ids minus the public ones
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Notification.getUserIdsOfLoodleMinusPublic = function (loodle_id, callback) {

	// Get user ids
	// Filter : remove the ones not registred

	async.waterfall([
		// Get user ids
		function (done) {
			Notification.getUserIdsOfLoodle(loodle_id, done)
		},
		// Filter : remove the ones not registred
		function (user_ids, done) {

			var results = [];

			async.each(user_ids, function (user_id, end) {

				var query = 'SELECT status FROM users WHERE id = ?';
				db.execute(query
					, [ user_id ]
					, { prepare : true }
					, function (err, result) {
						if (err)
							return end(err);

						if (result.rows[0].status === 'registred')
							results.push(user_id);

						return end();
					});

			}, function (err) {
				if (err)
					return done(err);

				return done(null, results);
			});
		}
	], callback);

};

/**
 * Get notifications ids from user
 * 
 * @param  {Uuid}   	user_id  	User identifier
 * @param  {Function} 	callback 	Standard callback function
 */
Notification.getIdsFromUser = function (user_id, callback) {

	var query = 'SELECT notification_id FROM notification_by_user WHERE user_id = ? limit 10';
	db.execute(query
		, [ user_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			var results = [];
			data.rows.forEach(function (element) {
				results.push(element.notification_id);
			});

			return callback(null, results);
		})

};

/**
 * Mark the notification as read
 * 
 * @param  {Uuid}   	notification_id 	Notification identifier
 * @param  {Function} 	callback        	Standard callback function
 */
Notification.markAsRead = function (notification_id, callback) {

	var query = 'UPDATE notifications SET is_read = true WHERE id = ?';
	db.execute(query
		, [ notification_id ]
		, { prepare : true }
		, callback);

};

/**
 * Get notification ids from loodle
 * 
 * @param  {Uuid}   	loodle_id 	Loodle identifier
 * @param  {Function} 	callback  	Standard callback function
 */
Notification.getIdsFromLoodle = function (loodle_id, callback) {

	var query = 'SELECT notification_id FROM notification_by_doodle WHERE doodle_id = ?';
	db.execute(query
		, [ loodle_id ]
		, { prepare : true }
		, function (err, data) {
			if (err)
				return callback(err);

			var results = [];
			data.rows.forEach(function (element) {
				results.push(element.notification_id);
			});

			return callback(null, results);
		});

};

/**
 * Delete the notification
 * 
 * @param  {String}   notification_id 	Notification identifier
 * @param  {Function} callback        	Standard callback function
 */
Notification.delete = function (notification_id, callback) {

	var query = 'DELETE FROM notifications WHERE id = ?';
	db.execute(query
		, [ notification_id ]
		, { prepare : true }
		, callback);

};

/**
 * Delete the assocation between the user and the notification
 * 
 * @param  {String}   user_id         	User identifier
 * @param  {String}   notification_id 	Notification identifier
 * @param  {Function} callback        	Standard callback function
 */
Notification.deleteAssociationWithUser = function (user_id, notification_id, callback) {

	var query = 'DELETE FROM notification_by_user WHERE user_id = ? AND notification_id = ?';
	db.execute(query, [ user_id, notification_id ], { prepare : true }, callback);

};

/**
 * Delete the assocations between the loodle and its notifications
 * 
 * @param  {String}   loodleId 		Loodle identifier
 * @param  {Function} callback 		Standard callback function
 */
Notification.deleteAssociationsWithLoodle = function (loodleId, callback) {

	var query = 'DELETE FROM notification_by_doodle WHERE doodle_id = ?';
	db.execute(query, [ loodleId ], { prepare : true }, callback);

};

module.exports = Notification;