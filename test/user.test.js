var assert = require('assert');
var User = require('../app/controllers/user');
var UserModel = require('../app/models/user.model');
var Loodle = require('../app/models/loodle.model');

describe('User', function () {

	describe('createUser', function () {

		var riri = {
			email: "ririduck@gmail.com",
			first_name: "Riri",
			last_name: "Duck",
			password: "mypassword"
		};
		var result;

		before(function (done) {
			// Ensure that the user email we're going to test is not already used
			UserModel.getUserIdByEmail(riri.email, function (err, userId) {
                if (err) 
                	return done(err);

                // This email is already used, we modify the our test user email
                if (userId)
                	riri.email = riri.email.split('@')[0] + riri.email.split('@')[0] + '@' + riri.email.split('@')[1];

                return done();
            });
		});

		after(function (done) {
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

		it('should send back the user data', function (done) {

			User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {

				assert.equal(data.email, riri.email);
				assert.equal(data.first_name, riri.first_name);
				assert.equal(data.last_name, riri.last_name);

				result = data;
				done();

			});
			
		});

		it('should save the user as "registred"', function () {

			assert.equal(result.status, 'registred');

		});

		it('should send back an error if the email is already used', function (done) {

			User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {

				assert.equal(err,'This email is already used');
				done();

			});

		});

	});

	describe('createPublicUser', function () {

		var loodle = new Loodle('My wonderfull public loodle', 'Wonderfull !', 'public');
		var riri = {
			email: "test@gmail.com",
			first_name: "Riri",
			last_name: "Duck",
			password: "mypassword"
		};
		var result;

		before(function (done) {
			loodle.save(done);
		});

		it('should send back the user data', function (done) {

			User.createPublicUser(loodle.id, riri.first_name, riri.last_name, function (err, data) {

				assert.equal(data.first_name, riri.first_name);
				assert.equal(data.last_name, riri.last_name);

				result = data;
				done();

			});
			
		});

		it('should save the user as "temporary"', function () {

			assert.equal(result.status, 'temporary');

		});

	});
});