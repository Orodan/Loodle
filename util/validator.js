var db = require('../config/database');

var Validator = {};

Validator.isAKnownUserId = function (userId, callback) {

    var query = 'SELECT * FROM users WHERE id = ?';
    db.execute(query, [ userId ], { prepare : true }, function (err, data) {

        if (err) return callback(err);

        // The userId is unknown
        if (data.rows.length === 0)
            return callback(null, false);

        // The userId is known
        return callback(null, true);
    });

};

module.exports = Validator;