var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/controllers/user');

module.exports = function (passport) {

	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================

	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	passport.serializeUser(function (user, callback) {
		return callback(null, user.id);
	});

	passport.deserializeUser(function (id, callback) {
		User.get(id, function (err, user) {
			return callback(err, user);
		});
	});

	// =========================================================================
	// Local signup ============================================================
	// =========================================================================

	passport.use('local-signup', new LocalStrategy({
		// By default the local strategy uses username and password, we override
		// it with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function (req, email, password, callback) {

		User.getByEmail(email, function (err, user) {

				// If an error happened, stop everything and send it back
				if (err) { return callback(null, false, { message : err }); }

				// The user already exists, stop
				if (user) { return callback(null, false, { message: 'That email is already taken.' }); }

				user = new User(email, req.body.first_name, req.body.last_name, password);
				user.save(function (err) {
			    		if (err) { return callback(err); }
			    		return callback(null, user);
				});
		});

	}));


	// =========================================================================
	// Local login =============================================================
	// =========================================================================

	passport.use('local-login', new LocalStrategy({
    	usernameField : 'email',
    	passwordField : 'password',
    	passReqToCallback : true    // allow us to pass back the entire request to the callback
	},
	function (req, email, password, callback) {

    	User.getByEmail(email, function (err, user) {

        	// If an error happened, stop everything and send it back
        	if (err) { console.log('error : ', err); return callback(null, false, req.flash('loginMessage', err)); }

            // No user found
            if (!user) { console.log('No user found'); return callback(null, false, 'No user found.'); }
            // if (!user) { return callback(null, false, req.flash('loginMessage', 'No user found')); }

        	// If the user is found but the password is wrong
        	if (!User.validPassword(password, user.password)) {
                    console.log('Invalid password');
            		return callback(null, false, { message: 'Oops ! Wrong password.' });
        	}

        	return callback(null, user, { message: 'Welcome !' });
    	});
	}));
	

};