// Dependencies =======================================================
var async      = require('async');
var bcrypt     = require('bcrypt-nodejs');
var cassandra  = require('cassandra-driver');

var Loodle     = require('../models/loodle.model');
var User       = require('../models/user.model');
var PublicUser = require('../models/public-user.model');
var Schedule   = require('../models/schedule.model');
var Configuration = require('../models/configuration.model');

var Vote       = require('../controllers/vote');

var jwt        = require('jsonwebtoken');
var Config     = require('../../Config/config');

var Validator  = require('../../util/Validator');

/** @class UserController */
var UserController = {};

/////////////////
// Route calls //
/////////////////

// Data validation are only made on this function because they are the
// only ones which are called by the user

/**
 * Route call to authenticate the user
 * 
 * @param  {Object}     req     Incoming request
 * @param  {Object}     res     Response to send
 */
UserController._authenticate = function (req, res) {

    if (!Validator.isDefined(req.body.email))
        return reply(res, 'Email required', 400);

    if (!Validator.isDefined(req.body.password))
        return reply(res, 'Password required', 400);

    UserController.authenticate(req.body.email, req.body.password, function (err, data) {
        return reply(res, err, data);
    });

};

/**
 * Route call to remove the user from the loodle
 * 
 * @param  {Object}     req     Incoming request
 * @param  {Object}     res     Response to send
 */
UserController._remove = function (req, res) {

    UserController.remove(req.params.id, req.body.user_id, function (err, data) {
        return reply(res, err, data);
    });

};

/**
 * Route call to create a public user in a loodle
 * 
 * @param  {Object}     req     Incoming request
 * @param  {Object}     res     Response to send
 */
UserController._createPublicUser = function (req, res) {

    UserController.createPublicUser(req.params.id, req.body.first_name, req.body.last_name, function (err, data) {
        return reply(res, err, data);
    });

};

/**
 * Route call to get the current user data
 * 
 * @param  {Object}     req     Incoming request
 * @param  {Object}     res     Response to send
 */
UserController._get = function (req, res) {

    if (req.user) {
        UserController.get(req.user.id, function (err, data) {
            return reply(res, err, data);
        });
    }
    else 
        return reply(res, null, false);

};

/**
 * Route call to create a user
 * 
 * @param  {Object}     req     Incoming request
 * @param  {Object}     res     Response to send
 */
UserController._createUser = function (req, res) {

    if (!Validator.isDefined(req.body.email))
        return reply(res, 'Email required', 400);

    if (!Validator.isDefined(req.body.first_name))
        return reply(res, 'First name required', 400);

    if (!Validator.isDefined(req.body.last_name))
        return reply(res, 'Last name required', 400);

    if (!Validator.isDefined(req.body.password))
        return reply(res, 'Password required', 400);

    UserController.createUser(req.body.email, req.body.first_name, req.body.last_name, req.body.password, function (err, data) {
        if (err) return reply(res, err.message, data);

        return reply(res, null, data);
    });

};

// Standard call function to send back data in json
function reply (res, err, data) {

    if (err) {
        if (data === undefined)
            data = 500;

        res.status(data);
        return res.json({"data": err});
    }

    return res.json({"data": data});
}

//////////////////////////////
// User controller features //
//////////////////////////////

/**
 * Authenticate a user
 * 
 * @param  {string}     email       User email
 * @param  {string}     password    User password
 * @param  {function}   callback    Standard callback function
 */
UserController.authenticate = function (email, password, callback) {

    User.getByEmail(email, function (err, user) {

        // If an error happened, stop everything and send it back
        if (err)
            return callback(err);

        if (!user) {
            return callback('No user found', 404);
        }

        if (!User.validPassword(password, user.password))
            return callback('Wrong password');

        var token = jwt.sign(user, Config.jwt_secret, {
            // expiresIn: 86400 // Expires in 24 hours
        });

        return callback(null, token);

    });

};

/**
 * Create a public (temporary) user
 * 
 * @param  {String}         loodle_id       Loodle identifier
 * @param  {String}         first_name      First name of the new user
 * @param  {String}         last_name       Last name of the new user
 * @param  {Function}       callback        Standard callback function
 */
UserController.createPublicUser = function (loodle_id, first_name, last_name, callback) {

    var user = new PublicUser(first_name, last_name);

    Loodle.get(loodle_id, function (err, data) {
        if (err) return callback(err);

        async.parallel({
            // Save the user
            save: function (done) {
                user.save(done);
            },
            // Bind user - loodle
            bind: function (done) {
                PublicUser.bind(user.id, loodle_id, done);
            },
            // Create default votes
            defaultVotes: function (done) {
                Vote.createDefaultVotesForLoodle(loodle_id, user.id, done);
            }
        }, function (err) {
            if (err) return callback(err);
            return callback(null, user);
        });

    });

};

/**
 * Create a new user
 *
 * @param  {String}     email       Email of the new user
 * @param  {String}     first_name  First name of the new user
 * @param  {String}     last_name   Last name of the new user
 * @param  {String}     password    Password of the new user
 */
UserController.createUser = function (email, first_name, last_name, password, callback) {

    var user = new User(email, first_name, last_name, password);

    async.series({

        checkHasAllInformations: function (done) {

            if (!Validator.user.hasAllInformations(email, first_name, last_name, password))
                return done(new Error('Missing one parameter'));

            return done();

        },
        checkEmail: function (done) {

            User.getUserIdByEmail(email, function (err, result) {

                if (err) return done (err);
                if (result) return done(new Error('This email is already used'));

                return done();
            }); 

        },
        save: function (done) { 

            user.save(function (err, data) {
                if (err) return done(err);

                return done(null, data);
            });
            
        }
    }, function (err, data) {
        if (err) return callback(err);

        return callback(null, data.save);
    });

};

/**
 * Delete the user
 * 
 * @param  {String}     user_id     User identifier
 * @param  {Function}   callback    Standard callback function
 */
UserController.delete = function (userId, callback) {

    var loodleIds;

    async.series({
        getLoodleIds: function (end) {

            User.getLoodleIds(userId, function (err, data) {
                if (err) return end(err);

                loodleIds = data;
                return end();
            });

        },

        deleteAssociationsWithLoodle: function (end) {

            async.each(loodleIds, function (loodleId, done) {
                UserController.deleteAssociationsWithLoodle(userId, loodleId, done);
            }, end);

        },

        deleteUser: function (end) {

            User.getLoodleIds(userId, function (err, data) {

                async.waterfall([
                    async.apply(User.get, userId),
                    function (user, done) {
                        async.parallel([
                            async.apply(User.delete, user.id),
                            async.apply(User.deleteEmailReference, user.email)
                        ], done);
                    }
                ], end);

            });

        }

    }, callback);

};

/**
 * Delete associations between user and loodle
 * 
 * @param  {String}     userId      User identifier
 * @param  {String}     loodleId    Loodle identifier
 * @param  {Function}   callback    Standard callback function
 */
UserController.deleteAssociationsWithLoodle = function (userId, loodleId, callback) {

    Loodle.getUsersIds(loodleId, function (err, userIds) {
        if (err) return callback(err);

        // The user was the only one left, we delete the loodle completely
        if (userIds.length === 1 && userIds[0].equals(userId)) {
            Loodle.delete(loodleId, callback);
        }
        // The use was not the only one left, we simply delete its associations
        else {
            Loodle.removeUser(loodleId, userId, callback);
        }
    });

};

/**
 * Delete the user if he/she is temporary
 * 
 * @param  {uuid}       user_id     User identifier
 * @param  {Function}   callback    Standard callback function
 */
UserController.deleteIfTemporary = function (user_id, callback) {

    async.waterfall([

        // Get user data
        function (done) {
            User.get(user_id, done);
        },

        // Delete if temporary
        function (user, done) {

            if (user.status === 'temporary')
                User.delete(user_id, done);
            else
                return done();
        }

    ], callback);

};

/**
 * Delete the votes of the user on the loodle
 * 
 * @param  {uuid}       user_id     User identifier
 * @param  {uuid}       loodle_id   Loodle identifier
 * @param  {Function}   callback    Standard callback function
 */
UserController.deleteVotes = function (user_id, loodle_id, callback) {

    async.parallel({

        // Delete the votes
        deleteVotes: function (done) {
            async.waterfall([
                // Get the vote ids of the user in the loodle
                function (end) {
                    User.getVoteIds(user_id, loodle_id, end);
                },
                // Delete votes
                function (vote_ids, end) {
                    async.each(vote_ids, function (vote_id, finish) {
                        Vote.delete(vote_id, finish);
                    }, end);
                }
            ], done);
        },

        // Delete the votes associations
        deleteAssociations: function (done) {
            Vote.removeAssociationsByUser(loodle_id, user_id, done);
        }

    }, callback);

};

/**
 * Remove a user from a loodle
 * 
 * @param  {type}       loodle_id   Loodle identifier
 * @param  {type}       user_id     User identifier
 * @param  {Function}   callback    Standard callback function
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
 * @param  {uuid}       user_id     User identifier
 * @param  {Function}   callback    Standard callback function
 */
UserController.get = function (user_id, callback) {

    Validator.user.knownId(user_id, function (err, result) {
        if (err) return callback(err);

        if (!result)
            return callback(new ReferenceError('Unknown user id'));

        User.get(user_id, callback);
    });

};

/**
 * Get loodle ids the user is associated with
 * 
 * @param  {String}     user_id     User identifier
 * @param  {Function}   callback    Standard callback function
 */
UserController.getLoodleIds = function (user_id, callback) {

    return User.getLoodleIds(user_id, callback);

};

/**
 * Get user data by his/her email
 * 
 * @param  {String}     user_email      User email
 * @param  {Function}   callback        Standard callback function
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
 * @param  {String}     password        Password given by the user
 * @param  {Hash}       user_password   Hashed password saved in db
 * 
 * @return {Boolean}                    true if password or equals, wrong if not
 */
UserController.validPassword = function (password, user_password) {
    return User.validPassword(password, user_password);
};

module.exports = UserController;