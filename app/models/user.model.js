var db = require('../../config/database');
var cassandra = require('cassandra-driver');

/**
 * Get the user data
 * @param id
 * @param callback
 */
exports.get = function (id, callback) {

	var query = 'SELECT id, email, first_name, last_name, password, status FROM Users WHERE id = ?';
	db.execute(query, [ id ], { prepare : true }, function (err, result) {
		if (err) { return callback(err); }
		if (result.rows.length === 0) { return callback(null, false); }
		return callback(null, result.rows[0]);
	});
};

/**
 * Get the user id by his/her email
 * @param email
 * @param callback
 */
exports.getUserIdByEmail = function (email, callback) {

	var query = 'SELECT user_id FROM user_by_email WHERE email = ?';
	db.execute(query, [ email ], { prepare : true }, function (err, result) {
		if (err) { return callback(err); }
		if (result.rows.length === 0) { return callback(null, false); }
        return callback(null, result.rows[0].user_id);
	});
};

/**
 * Save the user
 * @param id
 * @param email
 * @param first_name
 * @param last_name
 * @param password
 * @param status
 * @param callback
 */
exports.save = function (id, email, first_name, last_name, password, status, callback) {

    var query = 'INSERT INTO Users (id, email, first_name, last_name, password, status, created) values (?, ?, ?, ?, ?, ?, ?)';
    db.execute(query,
        [ id, email, first_name, last_name, password, status, Date.now() ],
        { prepare: true },
        callback
    );
};

/**
 * Save the association between the user and his/her email
 * @param id
 * @param email
 * @param callback
 */
exports.saveLinkWithEmail = function (id, email, callback) {

    var query = 'INSERT INTO user_by_email (email, user_id) values (?, ?)';
    db.execute(query, [ email, id ], { prepare: true }, callback);
};




