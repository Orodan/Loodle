var assert = require('assert');
var User = require('../app/controllers/user');
var UserModel = require('../app/models/user.model');
var Loodle = require('../app/controllers/loodle');
var LoodleModel = require('../app/models/loodle.model');
var async = require('async');

var util = require('util');

describe('User', function () {

	var riri = {
		email: "ririduck@gmail.com",
		first_name: "Riri",
		last_name: "Duck",
		password: "mypassword"
	};
	var result;

	// For every test we are going to use the user riri
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

	describe('createUser', function () {

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

		it('should send the user data', function (done) {

			User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {

				result = data;

				try {
					assert.equal(err, null);
					assert.equal(data.email, riri.email);
					assert.equal(data.first_name, riri.first_name);
					assert.equal(data.last_name, riri.last_name);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});
			
		});

		it('should save the user as "registred"', function () {

			assert.equal(result.status, 'registred');

		});

		it('should send back an error if the email is already used', function (done) {

			User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {

				try {
					assert.equal(err,'This email is already used');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

	});

	describe('createPublicUser', function () {
		this.timeout(12000);

		var loodle;

		before(function (done) {

			Loodle.createPublicLoodle('My wonderfull public loodle', 'Wonderfull !', [], 'en', function (err, data) {
				if (err) 
					return done(err);

				loodle = data;
				return done();
			});

		});

		// Delete the loodle
		after(function (done) {
			Loodle.remove(loodle.id, done);
		});

		it('should send back the user data', function (done) {

			User.createPublicUser(loodle.id, riri.first_name, riri.last_name, function (err, data) {

				result = data;

				try {
					assert.equal(err, null);
					assert.equal(data.first_name, riri.first_name);
					assert.equal(data.last_name, riri.last_name);
					assert.equal(data.status, 'temporary');
				}
				catch (e) {
					return done(e);
				}
				
				return done();

			});
			
		});
		
		it('should save the user as "temporary"', function () {
			assert.equal(result.status, 'temporary');
		});

		
		it('should send an error if the loodle id is unknown', function (done) {

			User.createPublicUser('00000000-0000-0000-0000-000000000000', riri.first_name, riri.last_name, function (err, data) {

				try {
					assert.equal(err, 'No loodle found with this id');
					assert.equal(data, null);
				}
				catch (e) {
					return done(e);
				}
				
				return done();

			});

		});


		it('should send an error if the loodle id is not a valid uuid', function (done) {

			User.createPublicUser('', riri.first_name, riri.last_name, function (err, data) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
					assert.equal(data, null);
				}
				catch (e) {
					return done(e);
				} 
				
				return done();

			});

		});

	});

	
	describe('get', function () {

		before(function (done) {

			User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {
				if (err)
					return done(err);

				result = data;
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

		it('should send the user data', function (done) {

			User.get(result.id, function (err, data) {
				
				try {
					assert.equal(err, null);
					assert.equal(riri.email, data.email);
					assert.equal(riri.first_name, data.first_name);
					assert.equal(riri.last_name, data.last_name);	
				}
				catch (e) {
					return done(e);
				}
				
				return done();
			});

		});

		it('should send false if the user id is unknown', function (done) {

			User.get('00000000-0000-0000-0000-000000000000', function (err, data) {

				try {
					assert.equal(err, null);
					assert.equal(data, false);
				} catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the user id is not a valid uuid', function (done) {

			User.get('', function (err, data) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
					assert.equal(data, null);	
				}
				catch (e) {
					return done(e);
				}
				
				return done();

			});

		});

	});

	
	describe('getLoodleIds', function () {

		var loodle;

		before(function (done) {

			Loodle.createLoodle(result.id, 'Mon doodle', 'Ma description', function (err, data) {
				if (err)
					return done(err);

				loodle = data;
				return done();

			});

		});

		after(function (done) {
			Loodle.remove(loodle.id, done);
		});

		it('should send an array of loodle ids', function (done) {

			User.getLoodleIds(result.id, function (err, data) {

				try {
					assert.equal(err, null);
					assert.equal(data[0].equals(loodle.id), true);	
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an empty array if the user id is unknown', function (done) {

			User.getLoodleIds('00000000-0000-0000-0000-000000000000', function (err, data) {

				try {
					assert.equal(err, null);
					assert.equal(data.length, 0);	
				}
				catch (e) {
					return done(e);	
				}
				
				return done();

			});

		});

		it('should send an error if the user id is not a valid uuid', function (done) {

			User.getLoodleIds('', function (err, data) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
					assert.equal(data, null);	
				}
				catch (e) {
					return done(e);
				}
				
				return done();

			});

		});
	});

});