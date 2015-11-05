var async      = require('async');
var bcrypt     = require('bcrypt-nodejs');
var cassandra  = require('cassandra-driver');

var User       = require('../models/user.model');
var PublicUser = require('../models/public-user.model');
var Vote       = require('../controllers/vote');

var jwt        = require('jsonwebtoken');
var Config     = require('../../Config/config');

var UserController = {};

// Route calls ========================================================

// Data validation are only made on this function because they are the
// only ones which are called by the user

// Authenticate the user
UserController._authenticate = function (req, res) {

    UserController.authenticate(req.body.email, req.body.password, function (err, data) {
        return callback(res, err, data);
    });

};

// Remove the user from the loodle
UserController._remove = function (req, res) {

    UserController.remove(req.params.id, req.body.user_id, function (err, data) {
        return callback(res, err, data);
    });

};

// Create a public user in the loodle
UserController._createPublicUser = function (req, res) {

    UserController.createPublicUser(req.params.id, req.body.first_name, req.body.last_name, function (err, data) {
        return callback(res, err, data);
    });
};

// Get the current user data
UserController._get = function (req, res) {

    // Validation
    // - req.user is defined

    if (req.user) {
        UserController.get(req.user.id, function (err, data) {
            return callback(res, err, data);
        });
    }
    else 
        return callback(res, null, false);

};

// Standard call function to send back data in json
function callback (res, err, data) {
    if (err) {
        res.status(500);
        return res.json({"data": err})
    }

    return res.json({"data": data});
}

// User controller features ===========================================

/**
 * Authenticate a user
 * 
 * @param  {String}     email       [user email]
 * @param  {String}     password    [user password]
 * @param  {Function}   callback    [standard callback function]
 * 
 * @return {String}            [the access token or error message]
 */
UserController.authenticate = function (email, password, callback) {

    User.getByEmail(email, function (err, user) {

        // If an error happened, stop everything and send it back
        if (err)
            return callback(err);

        if (!user)
            return callback('No user found');

        if (!User.validPassword(password, user.password))
            return callback('Wrong password');

        var token = jwt.sign(user, Config.jwt_secret, {
            expiresIn: 86400 // Expires in 24 hours
        });

        return callback(null, token);

    });

};

/**
 * Create a public (temporary) user
 * 
 * @param  {uuid}       loodle_id   [loodle identifier]
 * @param  {String}     first_name  [first name of the new user]
 * @param  {String}     last_name   [last name of the new user]
 * @param  {Function}   callback    [standard callback function]
 * 
 * @return {String}              [Success or error message]
 */
UserController.createPublicUser = function (loodle_id, first_name, last_name, callback) {

    // new public user
    // save it
    // bind it to the loodle
    // Create default votes

    var user = new PublicUser(first_name, last_name);

    async.parallel({
        // Save the user
        save: function (done) {
            user.save(done);
        },

        // Bind user - loodle
        bind: function (done) {
            PublicUser.bind(user.id, loodle_id, done);
        },

        defaultVotes: function (done) {
            Vote.createDefaultVotesForLoodle(loodle_id, user.id, done);
        }
    }, function (err, result) {
        if (err)
            return callback(err);

        return callback(null, user);
    });

};

/**
 * Remove a user from a loodle
 * 
 * @param  {type}       loodle_id   [loodle identifier]
 * @param  {type}       user_id     [user identifier]
 * @param  {Function}   callback    [standard callback function]
 * 
 * @return {String}                 [Success or error message]
 */
UserController.remove = function (loodle_id, user_id, callback) {

    // Request verification
    
    User.remove(loodle_id, user_id, function (err) {
        if (err)
            return callback(err);

        return callback(null, 'User removed');
    });

};

/**
 * Get user data
 * 
 * @param  {uuid}       user_id     [user identifier]
 * @param  {Function}   callback    [standard callback function]
 * 
 * @return {Object}                 [user object or error message]
 */
UserController.get = function (user_id, callback) {
  
    return User.get(user_id, callback);

};

/**
 * Get user data by his/her email
 * 
 * @param  {String}     user_email  [user email]
 * @param  {Function}   callback    [standard callback function]
 * 
 * @return {Object}                 [user object or error message]
 */
UserController.getByEmail = function (user_email, callback) {

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
 * Validate a password (compare a hashed and a non-hashed password)
 * 
 * @param  {String}     password        [password given by the user]
 * @param  {Hash}       user_password   [hashed password saved in db]
 * 
 * @return {Boolean}                    [true if password or equals, wrong if not]
 */
UserController.validPassword = function (password, user_password) {
    return User.validPassword(password, user_password);
};

module.exports = UserController;