var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var cassandra = require('cassandra-driver');

var UserModel = require('../models/user.model');
var PublicUser = require('../models/public-user.model');

var Vote = require('../controllers/vote');

var jwt = require('jsonwebtoken');

function User (email, first_name, last_name, password) {

    this.id = cassandra.types.Uuid.random();
    this.email = email;
    this.first_name = first_name;
    this.last_name = last_name;
    this.password = User.generateHash(password);
    this.status = 'registred';
}


User.prototype.save = function (callback) {

    var that = this;

    async.parallel([
            function (end) {
                UserModel.save(that.id, that.email, that.first_name,
                    that.last_name, that.password, that.status, end);
            },
            function (end) {
                UserModel.saveLinkWithEmail(that.id, that.email, end);
            }
        ], function (err) {
            if (err) {
                return callback(err);
            }
            return callback(null, that);
    });
};

// Controller ==========================================

User.get = function (user_id, callback) {

    UserModel.get(user_id, callback);

};

User.getByEmail = function (user_email, callback) {

    async.waterfall([
        function (end) {
            UserModel.getUserIdByEmail(user_email, function (err, user_id) {
                if (err) 
                    return end(err);
                
                return end(null, user_id);
            });
        },
        function (user_id, end) {
            if(!user_id) 
                return end();

            UserModel.get(user_id, end);
        }
    ], callback);

};

User.authenticate = function (req, res) {

    User.getByEmail(req.body.email, function (err, user) {

        // If an error happened, stop everything and send it back
        if (err) 
            return error(res, err);

        if (!user)
            return error(res, 'No user found');

        if (!User.validPassword(req.body.password, user.password))
            return error(res, 'Wrong password');

        var token = jwt.sign(user, 'secret', {
          expiresIn: 86400 // expires in 24 hours
        });

        return success(res, token);
    });

};

User.remove = function (loodle_id, user_id, callback) {

    async.parallel({
        // Delete the association user - loodle
        removeUserFromLoodle: function (done) {
            UserModel.remove(loodle_id, user_id, done);
        },
        // Delete the votes of the user for each schedules of the loodle
        deleteVotes: function (done) {
            Vote.deleteVotesFromUser(loodle_id, user_id, done);
        }
    }, callback);

};

User.createPublicUser = function (req, res) {

    // new public user
    // save it
    // bind it to the loodle
    // Create default votes

    var user = new PublicUser(req.body.first_name, req.body.last_name);

    async.parallel({
        // Save the user
        save: function (done) {
            user.save(done);
        },

        // Bind user - loodle
        bind: function (done) {
            PublicUser.bind(user.id, req.params.id, done);
        },

        defaultVotes: function (done) {
            Vote.createDefaultVotesForLoodle(req.params.id, user.id, done);
        }
    }, function (err, result) {
        if (err) {
            console.log("Error : ", err);
            return error(res, err);
        }

        return success(res, user);
    });

};

User.validPassword = function (password, user_password) {
    return bcrypt.compareSync(password, user_password);
};

User.generateHash = function (text) {
    return bcrypt.hashSync(text, bcrypt.genSaltSync(8), null);
};

function error(res, err) {
    res.status(500);
    res.json({
        type: false,
        data: 'An error occured : ' + err
    });
};

function success(res, data) {
    res.json({
        type: true,
        data: data
    });
};

module.exports = User;