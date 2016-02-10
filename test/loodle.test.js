var assert    = require('assert');

var Loodle    = require('../app/controllers/loodle');
var User      = require('../app/controllers/user');
var UserModel = require('../app/models/user.model');

describe('Loodle', function () {

	var riri = {
		email: "ririduck@gmail.com",
		first_name: "Riri",
		last_name: "Duck",
		password: "mypassword"
	};
	var savedUser;

	// For every test we are going to use the user riri
	before(function (done) {

		// Ensure that the user email we're going to test is not already used
		UserModel.getUserIdByEmail(riri.email, function (err, userId) {
            if (err)
            	return done(err);

            // This email is already used, we modify the our test user email
            if (userId)
            	riri.email = riri.email.split('@')[0] + riri.email.split('@')[0] + '@' + riri.email.split('@')[1];

        	User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {

        		riri = data;
        		return done();

        	});

        });

	});

	after(function (done) {

		// Clean the user created for the test
		UserModel.getUserIdByEmail(riri.email, function (err, userId) {
			if (err) 
				return done(err);

			// We clean the database of the user we created for the test
			if (userId)
				User.delete(userId, done);
			else 
				return done();
		});

	});

	describe('createLoodle', function () {

		var myLoodle = {
			'name': 'Mon super loodle',
			'description': 'Ma super description'
		};
		var result;

		after(function (done) {
			Loodle.remove(result.id, done);
		});

		it('should send the loodle data', function (done) {

			Loodle.createLoodle(riri.id, myLoodle.name, myLoodle.description, function (err, loodle) {

				result = loodle;

				try {
					assert.equal(err, null);
					assert.equal(loodle.name, myLoodle.name);
					assert.equal(loodle.description, myLoodle.description);
					assert.equal(loodle.category, 'private');
				}
				catch (e) {
					return done(e);
				}
				
				return done();

			});

		});

		it('should send an error if the user id is unknown', function (done) {
			
			
			Loodle.createLoodle('00000000-0000-0000-0000-000000000000', myLoodle.name, myLoodle.description, function (err, loodle) {

				try {
					assert.equal(err.name, 'ReferenceError');
					assert.equal(err.message, 'Unknown user id');
					assert.equal(loodle, null);
				}
				catch (e) {
					return done(e);
				}
				
				return done();

			});

		});

		it('should send an error if the user id is not a valid uuid', function (done) {

			Loodle.createLoodle('', myLoodle.name, myLoodle.description, function (err, loodle) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
					assert.equal(loodle, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

	});

});