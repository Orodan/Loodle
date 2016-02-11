var assert    = require('assert');
var async     = require('async');

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

		// Delete the user created for the test
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

		it('should send an error if one information is missing', function (done) {

			Loodle.createLoodle(riri.id, null, myLoodle.description, function (err, data) {

				try {
					assert.equal(err.name, 'Error');
					assert.equal(err.message, 'Missing one parameter');
					assert.equal(data, null);
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

			Loodle.createLoodle('zeofo', myLoodle.name, myLoodle.description, function (err, loodle) {

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

	describe('addSchedule', function (done) {

		var myLoodle = {
			'name': 'Mon super loodle',
			'description': 'Ma super description'
		};
		var result;

		// Create a loodle to play with
		before(function (done) {

			Loodle.createLoodle(riri.id, myLoodle.name, myLoodle.description, function (err, loodle) {
				if (err) return done(err);

				result = loodle;
				return done();
			});

		});

		// Delete the created loodle
		after(function (done) {
			Loodle.remove(result.id, done);
		});

		
		it('should add the schedule to the loodle', function (done) {

			Loodle.addSchedule(result.id, '10/02/2016 17:10', '10/02/2016 17:12', 'fr', function (err, data) {

				try {
					assert.equal(err, null);
					assert.equal(data, 'Schedule added');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the language is unknown', function (done) {

			Loodle.addSchedule(result.id, '10/02/2016 17:08', '10/02/2016 17:10', '', function (err, data) {

				try {
					assert.equal(err.name, 'Error');
					assert.equal(err.message, 'Unknown language');
					assert.equal(data, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the schedule is not on the same day', function (done) {

			Loodle.addSchedule(result.id, '10/02/2016 17:08', '11/02/2016 17:10', 'fr', function (err, data) {

				try {
					assert.equal(err.name, 'Error');
					assert.equal(err.message, 'Schedule is not on the same day');
					assert.equal(data, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});
		
		it('should send an error if the loodle id is unknown', function (done) {
			
			Loodle.addSchedule('00000000-0000-0000-0000-000000000000', '10/02/2016 17:08', '10/02/2016 17:10', 'fr', function (err, data) {

				try {
					assert.equal(err.name, 'ReferenceError');
					assert.equal(err.message, 'Unknown loodle id');
					assert.equal(data, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the loodle id is not a valid uuid', function (done) {
			
			Loodle.addSchedule('', '10/02/2016 17:08', '10/02/2016 17:10', 'fr', function (err, data) {

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

	describe('deleteSchedule', function (done) {

		var myLoodle = {
			'name': 'Mon super loodle',
			'description': 'Ma super description'
		};
		var result;

		// Create a loodle to play with
		before(function (done) {
		
			async.series({

				// Create the loodle
				createLoodle: function (end) {
					Loodle.createLoodle(riri.id, myLoodle.name, myLoodle.description, function (err, data) {
						if (err) return end(err);

						result = data;

						return end();

					});
				},

				// Add the schedule
				addSchedule: function (end) {
					Loodle.addSchedule(result.id, '10/02/2016 17:10', '10/02/2016 17:15', 'fr', end);
				},

				// Get the loodle data
				getLoodleData: function (end) {
					Loodle.get(result.id, function (err, data) {
						if (err) return end(err);

						result = data;
						return end();
					});
				}
			}, done);

		});

		// Delete the created loodle
		after(function (done) {
			Loodle.remove(result.id, done);
		});

		it('should delete the schedule', function (done) {

			Loodle.deleteSchedule(result.id, result.schedules[0].id, function (err, data) {

				try {
					assert.equal(err, null);
					assert.equal(data, 'Schedule deleted')
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});
		
		it('should send an error if the loodle id is unknown', function (done) {

			Loodle.deleteSchedule('00000000-0000-0000-0000-000000000000', result.schedules[0].id, function (err, data) {

				try {
					assert.equal(err.name, 'ReferenceError');
					assert.equal(err.message, 'Unknown loodle id');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the loodle is is not a valid uuid', function (done) {
			
			Loodle.deleteSchedule('agagaga', result.schedules[0].id, function (err, data) {

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

		it('should send an error if the schedule id is unknown', function (done) {
			
			Loodle.deleteSchedule(result.id, '00000000-0000-0000-0000-000000000000', function (err, data) {

				try {
					assert.equal(err.name, 'ReferenceError');
					assert.equal(err.message, 'Unknown schedule id');
					assert.equal(data, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the schedule id is not a valid uuid', function (done) {
			
			Loodle.deleteSchedule(result.id, 'afaiohao', function (err, data) {

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