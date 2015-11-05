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

UserController._authenticate = function (req, res) {

    UserController.authenticate(req.body.email, req.body.password, function (err, data) {
        return callback(res, err, data);
    });

};

UserController._remove = function (req, res) {

    UserController.remove(req.params.id, req.body.user_id, function (err, data) {
        return callback(res, err, data);
    });

};

UserController._createPublicUser = function (req, res) {

    UserController.createPublicUser(req.params.id, req.body.first_name, req.body.last_name, function (err, data) {
        return callback(res, err, data);
    });
};

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
 * @param  {[type]}   email    [user email]
 * @param  {[type]}   password [user password]
 * @param  {Function} callback [standard callback function]
 * @return {[type]}            [the access token or an error]
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
 * [createPublicUser description]
 * 
 * @param  {[type]} loodle_id  [description]
 * @param  {[type]} first_name [description]
 * @param  {[type]} last_name  [description]
 * @return {[type]}            [description]
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
 * Remove a user from a loodle (api call)
 * 
 * @param  {Object} req [request]
 * @param  {Object} res [response]
 * @return {Object}     [Success or error message]
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
 * Get the current user data
 * 
 * @param  {Object} req [request]
 * @param  {Object} res [response]
 * @return {Object}     [Current user data or error]
 */
UserController.get = function (user_id, callback) {

    if (user_id)  
        return User.get(user_id, callback);

    return callback(null, false);


};

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

UserController.validPassword = function (password, user_password) {
    return User.validPassword(password, user_password);
};

module.exports = UserController;