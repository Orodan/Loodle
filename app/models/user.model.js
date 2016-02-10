var async     = require('async');
var db        = require('../../config/database');
var cassandra = require('cassandra-driver');

var bcrypt     = require('bcrypt-nodejs');

// User ========================================================================

function User (email, first_name, last_name, password) {

    this.id = cassandra.types.Uuid.random();
    this.email = email;
    this.first_name = first_name;
    this.last_name = last_name;
    this.password = User.generateHash(password);
    this.status = 'registred';
    
}

/**
 * Delete the user
 * 
 * @param  {uuid}       user_id     user identifier
 * @param  {Function}   callback    standard callback function
 * @return {void}                   null or error message
 */
User.delete = function (user_id, callback) {

    var query = 'DELETE FROM users WHERE id = ?';
    db.execute(query
        , [ user_id ]
        , { prepare : true }
        , callback);

};

/**
 * Delete email reference of the user   
 * 
 * @param  {[type]}   userEmail     Email of the user
 * @param  {Function} callback      Standard callback function
 */
User.deleteEmailReference = function (userEmail, callback) {

    var query = 'DELETE FROM user_by_email WHERE email = ?';
    db.execute(query, [ userEmail ], { prepare : true }, callback);

};

// Prototypal functions ========================================================

User.prototype.save = function (callback) {

	// Save user 
	// Bind user to email

    var that = this;

    var queries = [
    	{
    		query: 'INSERT INTO Users (id, email, first_name, last_name, password, status, created) values (?, ?, ?, ?, ?, ?, ?)',
    		params: [ that.id, that.email, that.first_name, that.last_name, that.password, that.status, Date.now() ]
    	},
    	{
    		query: 'INSERT INTO user_by_email (email, user_id) values (?, ?)',
    		params: [ that.email, that.id ]
    	}
    ];

    db.batch(queries
    	, { prepare : true }
    	, function (err) {
    		if (err)
    			return callback(err);

    		return callback(null, that);
    	});
};

User.validPassword = function (password, user_password) {
    return bcrypt.compareSync(password, user_password);
};

User.generateHash = function (text) {
    return bcrypt.hashSync(text, bcrypt.genSaltSync(8), null);
};

User.remove = function (loodle_id, user_id, callback) {

	async.parallel({
        // Delete the association user - loodle
        removeUserFromLoodle: function (done) {
            User.remove(loodle_id, user_id, done);
        },
        // Delete the votes of the user for each schedules of the loodle
        deleteVotes: function (done) {
            Vote.deleteVotesFromUser(loodle_id, user_id, done);
        }
    }, callback);

};

User.getByEmail = function (user_email, callback) {

    async.waterfall([

        function (end) {
            User.getUserIdByEmail(user_email, function (err, user_id) {
                if (err) 
                    return end(err);
                
                return end(null, user_id);
            });
        },
        function (user_id, end) {
            if(!user_id) 
                return end();

            User.get(user_id, end);
        }
    ], callback);

};


/**
 * Get the user data
 * @param id
 * @param callback
 */
User.get = function (id, callback) {

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
User.getUserIdByEmail = function (email, callback) {

	var query = 'SELECT user_id FROM user_by_email WHERE email = ?';
	db.execute(query, [ email ], { prepare : true }, function (err, result) {
		if (err) { return callback(err); }
		if (result.rows.length === 0) { return callback(null, false); }
        return callback(null, result.rows[0].user_id);
	});
};

/**
 * Get vote ids of the user in the loodle
 * 
 * @param  {uuid}       user_id     user indentifier
 * @param  {uuid}       loodle_id   loodle identifier
 * @param  {Function}   callback    standard callback function
 * @return {array}                  array of vote ids or error message
 */
User.getVoteIds = function (user_id, loodle_id, callback) {

    var query = 'SELECT vote_id FROM vote_by_doodle_and_user WHERE doodle_id = ? AND user_id = ?';
    db.execute(query
        , [ loodle_id, user_id ]
        , { prepare : true }
        , function (err, data) {

            if (err)
                return callback(err);

            var results = [];

            data.rows.forEach(function (element) {
                results.push(element.vote_id);
            });

            return callback(null, results);
        });

};

/**
 * Save the user
 */
User.save = function (id, email, first_name, last_name, password, status, callback) {

    var query = 'INSERT INTO Users (id, email, first_name, last_name, password, status, created) values (?, ?, ?, ?, ?, ?, ?)';
    db.execute(query,
        [ id, email, first_name, last_name, password, status, Date.now() ],
        { prepare: true },
        callback
    );
};

/**
 * Get loodle ids the user is associated with
 * 
 * @param  {String}   userId       User identifier
 * @param  {Function} callback     Standard callback function
 */
User.getLoodleIds = function (userId, callback) {

    var query = 'SELECT doodle_id FROM doodle_by_user WHERE user_id = ?';
    db.execute(query, [ userId ], { prepare : true }, function (err, data) {

        if (err) { return callback(err); }

        var results = [];
        data.rows.forEach(function (element) {
            results.push(element.doodle_id);
        });

        return callback(null, results);
    });

};

/**
 * Save the association between the user and his/her email
 * @param id
 * @param email
 * @param callback
 */
User.saveLinkWithEmail = function (id, email, callback) {

    var query = 'INSERT INTO user_by_email (email, user_id) values (?, ?)';
    db.execute(query, [ email, id ], { prepare: true }, callback);
};

User.remove = function (loodle_id, user_id, callback) {

	var queries = [
		{
			query: 'DELETE FROM doodle_by_user WHERE user_id = ? AND doodle_id = ?',
			params: [ user_id, loodle_id ]
		},
		{
			query: 'DELETE FROM user_by_doodle WHERE doodle_id = ? AND user_id = ?',
			params: [ loodle_id, user_id ]
		}
	];

	db.batch(queries
		, { prepare : true }
		, callback);

};

module.exports = User;




