var db = require('../config/database');
var moment = require('moment');

var Validator = {};

// User validation
Validator.user = {};

/**
 * Check if the user is already associated with the loodle
 * 
 * @param  {String}   loodleId      Loodle identifier
 * @param  {String}   userId        User identifier
 * @param  {Function} callback      Standard callback function 
 */
Validator.user.alreadyInLoodle = function (loodleId, userId, callback) {

    var query = 'SELECT * FROM user_by_doodle WHERE doodle_id = ? AND user_id = ?';
    db.execute(query, [ loodleId, userId ], { prepare : true }, function (err, data) {
        if (err) return callback(err);

        // The user was found already associated with the loodle
        if (data.rows.length != 0) 
            return callback(null, true);

        return callback(null, false);
    })

};

/**
 * Check if all the informations required to create an user were given
 * 
 * @param  {String}  email          User email
 * @param  {String}  first_name     User first name
 * @param  {String}  last_name      User last name
 * @param  {String}  password       User password
 * @return {Boolean}                true if all the informations were given, false otherwise
 */
Validator.user.hasAllInformations = function (email, first_name, last_name, password) {

    var missingInfo = false;

    if (typeof email != 'string' || email.length === 0)
        missingInfo = true;
    if (typeof first_name != 'string' || first_name.length === 0)
        missingInfo = true;
    if (typeof last_name !== 'string' || last_name.length === 0)
        missingInfo = true;
    if (typeof password !== 'string' || password.length === 0)
        missingInfo = true;

    return !missingInfo;

};

/**
 * Check if the user id match a user in db
 * 
 * @param  {String}   userId        User identifier
 * @param  {Function} callback      Standard callback function
 */
Validator.user.KnownId = function (userId, callback) {

    var query = 'SELECT * FROM users WHERE id = ?';
    db.execute(query, [ userId ], { prepare : true }, function (err, data) {

        if (err) return callback(err);

        // The user id is unknown
        if (data.rows.length === 0)
            return callback(null, false);

        // The user id is known
        return callback(null, true);
    });

}

// Loodle validation
Validator.loodle = {};

/**
 * Check if all the informations required to create a loodle were given
 * 
 * @param  {String}     name        Loodle name
 * @return {Boolean}                true if all the informations were given, false otherwise
 */
Validator.loodle.hasAllInformations = function (name) {

    var missingInfo = false;

    if (typeof name != 'string' || name.length === 0)
        missingInfo = true;

    return !missingInfo;

};

/**
 * Check if the loodle id match a loodle in db
 * 
 * @param  {String}   loodleId      Loodle identifier
 * @param  {Function} callback      Standard callback function
 */
Validator.loodle.KnownId = function (loodleId, callback) {

    var query = 'SELECT * FROM doodles WHERE id = ?';
    db.execute(query, [ loodleId ], { prepare : true }, function (err, data) {

        if (err) return callback(err);

        // The loodle id is unknown
        if (data.rows.length === 0)
            return callback(null, false);

        // The loodle id is known
        return callback(null, true);
    });

};

// Schedule validation
Validator.schedule = {};

/**
 * Check if the schedule id match a schedule in db
 * 
 * @param  {String}   loodleId      Schedule identifier
 * @param  {Function} callback      Standard callback function
 */
Validator.schedule.KnownId = function (scheduleId, callback) {

    var query = 'SELECT * FROM schedules WHERE id = ?';
    db.execute(query, [ scheduleId ], { prepare : true }, function (err, data) {
        if (err) return callback(err);

        // The schedule id is unknown
        if (data.rows.length === 0)
            return callback(null, false);

        // The schedule id is known
        return callback(null, true);
    });

};

/**
 * Check if the language is a known language
 * 
 * @param  {String}  language   Locale language
 * @return {Boolean}            true if the language is known, false otherwise
 */
Validator.schedule.isAKnownLanguage = function (language) {

	var isValid = false;

	(language === 'en') ? isValid = true : '' ;
	(language === 'fr') ? isValid = true : '' ;

	return isValid;

};

/**
 * Check if the schedule is on the same day
 * 
 * @param  {String}  begin_time     Schedule begin time  
 * @param  {[type]}  end_time       Schedule end time     
 * @return {Boolean}                true if the schedule is on the same day, false otherwise
 */
Validator.schedule.isOnTheSameDay = function (begin_time, end_time, lang) {

    if (lang == 'en') {
        moment_begin_time = moment(begin_time, 'MM-DD-YYYY LT');
        moment_end_time = moment(end_time, 'MM-DD-YYYY LT');
    }
    else if (lang == 'fr') {
        moment_begin_time = moment(begin_time, 'DD-MM-YYYY HH:mm');
        moment_end_time = moment(end_time, 'DD-MM-YYYY HH:mm');
    }
    else {
        return false;
    }

    return moment_begin_time.isSame(moment_end_time, 'day');

};

module.exports = Validator;