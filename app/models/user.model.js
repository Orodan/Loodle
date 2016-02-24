var async     = require('async');
var db        = require('../../config/database');
var cassandra = require('cassandra-driver');

var bcrypt     = require('bcrypt-nodejs');

/**
 * Create a new user object
 * 
 * @param {String}  email       User email
 * @param {String}  first_name  User first name
 * @param {String}  last_name   User last name
 * @param {String}  password    User password
 */
function User (email, first_name, last_name, password) {

    this.id = cassandra.types.Uuid.random();
    this.email = email;
    this.first_name = first_name;
    this.last_name = last_name;
    this.password = User.generateHash(password);
    this.status = 'registred';
    
}

//////////////////////////
// Prototypal functions //
//////////////////////////

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

/////////////////////////
// User model features //
/////////////////////////

/**
 * Delete the user
 * 
 * @param  {Uuid}       user_id     User identifier
 * @param  {Function}   callback    Standard callback function
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
 * @param  {String}     userEmail     Email of the user
 * @param  {Function}   callback      Standard callback function
 */
User.deleteEmailReference = function (userEmail, callback) {

    var query = 'DELETE FROM user_by_email WHERE email = ?';
    db.execute(query, [ userEmail ], { prepare : true }, callback);

};

/**
 * Check if the given password match the user password
 * 
 * @param  {String}     password        Password given by the user trying to log in
 * @param  {String}     user_password   User password
 * 
 * @return {Boolean}                    True if the passwords matched, false otherwise
 */
User.validPassword = function (password, user_password) {

    return bcrypt.compareSync(password, user_password);

};

/**
 * Generate a hash from a given text
 * 
 * @param  {String} text    Text to hash
 * 
 * @return {String}         The hash generated
 */
User.generateHash = function (text) {

    return bcrypt.hashSync(text, bcrypt.genSaltSync(8), null);

};

/**
 * Remove an user from the specified loodle
 * 
 * @param  {Uuid}       loodle_id   Loodle identifier
 * @param  {Uuid}       user_id     User identifier
 * @param  {Function}   callback    Standard callback function
 */
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

/**
 * Get user dara from his/her email
 * 
 * @param  {String}     user_email      User email
 * @param  {Function}   callback        Standard callback function
 */
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
 * Get user data
 * @param  {Uuid}       id          User identifier
 * @param  {Function}   callback    Standard callback function
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
 * Get user id by his/her email
 * 
 * @param  {String}     email       User email
 * @param  {Function}   callback    Standard callback function
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
 * @param  {uuid}       user_id     User indentifier
 * @param  {uuid}       loodle_id   Loodle identifier
 * @param  {Function}   callback    Standard callback function
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
 * 
 * @param  {Uuid}       id          User identifier
 * @param  {String}     email       User email
 * @param  {Function}   callback    Standard callback function
 */
User.saveLinkWithEmail = function (id, email, callback) {

    var query = 'INSERT INTO user_by_email (email, user_id) values (?, ?)';
    db.execute(query, [ email, id ], { prepare: true }, callback);

};

/**
 * Delete the user if he/she is temporary
 * 
 * @param  {String}   userId    User identifier
 * @param  {Function} callback  Standard callback function
 */
User.deleteIfTemporary = function (userId, callback) {

    async.waterfall([
        // Get user info
        function getUserInfo (done) {
            User.get(userId, function (err, data) {
               if (err) return done(err);

                if (data.status === 'temporary')
                    return done(null, true);

                return done(null, false);
            });
        },

        // Delete the user if he is temporary
        function deleteIfTemporary(isTemporary, done) {
            if (!isTemporary) return done();
            User.delete(userId, done);
        }
    ], callback);

};

module.exports = User;




