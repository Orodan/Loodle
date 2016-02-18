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

	// For every test we are going to use the user riri
	before(function (done) {

		// Ensure that the user email we're going to test is not already used
		UserModel.getUserIdByEmail(riri.email, function (err, userId) {
            if (err) return done(err);

            // This email is already used, we modify the our test user email
            if (userId)
            	riri.email = riri.email.split('@')[0] + riri.email.split('@')[0] + '@' + riri.email.split('@')[1];

        	User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {
        		if (err) return done(err);

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
			Loodle.delete(result.id, done);
		});

		it('should create the loodle', function (done) {

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
			Loodle.delete(result.id, done);
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
			Loodle.delete(result.id, done);
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

	describe('addUser', function () {

		var myLoodle = {
			'name': 'Mon super loodle',
			'description': 'Ma super description'
		};
		var result;

		var fifi = {
			email: "fifiduck@gmail.com",
			first_name: "Fifi",
			last_name: "Duck",
			password: "mypassword"
		};

		before(function (done) {

			async.parallel({

				// Create a loodle
				createLoodle: function (end) {
					Loodle.createLoodle(riri.id, myLoodle.name, myLoodle.description, function (err, loodle) {
						if (err) return end(err);

						result = loodle;
						return end();
					});
				},

				// Create Fifi user
				createUser: function (end) {
					User.createUser(fifi.email, fifi.first_name, fifi.last_name, fifi.password, function (err, data) {
						if (err) return end(err);

						fifi = data;
						return end();
					});
				}

			}, done);

		});

		// Delete the created loodle
		after(function (done) {

			async.series([
				async.apply(Loodle.delete, result.id),
				async.apply(User.delete, fifi.id)
			], done);

		});

		it('should add the user to the loodle', function (done) {
			
			Loodle.addUser(result.id, fifi.id, function (err, result) {

				try {
					assert.equal(err, null);
					assert.equal(result, 'User added');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the user is already added to the user', function (done) {
			
			Loodle.addUser(result.id, fifi.id, function (err, data) {

				try {
					assert.equal(err.name, 'Error');
					assert.equal(err.message, 'User already present in loodle');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the loodle id is unknown', function (done) {
			
			Loodle.addUser('00000000-0000-0000-0000-000000000000', fifi.id, function (err, data) {

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

		it('should send an error if the loodle id is not a valid uuid', function (done) {
			
			Loodle.addUser('lgzgojz', fifi.id, function (err, data) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the user id is unknown', function (done) {
			
			Loodle.addUser(result.id, '00000000-0000-0000-0000-000000000000', function (err, data) {

				try {
					assert.equal(err.name, 'ReferenceError');
					assert.equal(err.message, 'Unknown user id');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the user id is not a valid uuid', function (done) {
			
			Loodle.addUser(result.id, 'jzhob', function (err, data) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

	});

	describe('removeUser', function () {

		var loodle = {
			'name': 'Mon super loodle',
			'description': 'Ma super description'
		};

		var fifi = {
			email: "fifiduck@gmail.com",
			first_name: "Fifi",
			last_name: "Duck",
			password: "mypassword"
		};

		// For this test we need one loodle with two users inside
		before(function (done) {

			async.series({

				// Create the loodle using Riri
				createLoodle: function (end) {
					Loodle.createLoodle(riri.id, loodle.name, loodle.description, function (err, data) {
						if (err) return end(err);

						loodle = data;
						return end();
					})
				},

				// Create Fifi
				createFifi: function (end) {
					User.createUser(fifi.email, fifi.first_name, fifi.last_name, fifi.password, function (err, data) {
						if (err) return end(err);

						fifi = data;
						return end(err);
					});
				},

				// Add him to the loodle
				addFifiToLoodle: function (end) {
					Loodle.addUser(loodle.id, fifi.id, end);
				}
			}, done);

		});

		// Delete Fifi (the loodle we played with has already been deleted during the test)
		after(function (done) {
			User.delete(fifi.id, done);
		});

		it('should remove the user from the loodle', function (done) {

			Loodle.removeUser(loodle.id, fifi.id, function (err, result) {

				try {
					assert.equal(err, null);
					assert.equal(result, 'User removed');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the user is not present in the loodle', function (done) {

			Loodle.removeUser(loodle.id, fifi.id, function (err, result) {

				try {
					assert.equal(err.name, 'ReferenceError');
					assert.equal(err.message, 'The user is not present is the loodle');
					assert.equal(result, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the loodle id is unknwon', function (done) {

			Loodle.removeUser('00000000-0000-0000-0000-000000000000', riri.id, function (err, result) {

				try {
					assert.equal(err.name, 'ReferenceError');
					assert.equal(err.message, 'Unknown loodle id');
					assert.equal(result, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the loodle id is not a valid uuid', function (done) {

			Loodle.removeUser('agabaigb', riri.id, function (err, result) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
					assert.equal(result, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the user id is unknwon', function (done) {

			Loodle.removeUser(loodle.id, '00000000-0000-0000-0000-000000000000', function (err, result) {

				try {
					assert.equal(err.name, 'ReferenceError');
					assert.equal(err.message, 'Unknown user id');
					assert.equal(result, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});;

		it('should send an error if the user id is not a valid uuid', function (done) {

			Loodle.removeUser(loodle.id, 'auhfuoahoh', function (err, result) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
					assert.equal(result, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should delete the loodle if the removed person was the last one in it', function (done) {

			Loodle.removeUser(loodle.id, riri.id, function (err, result) {

				try {
					assert.equal(err, null);
					assert.equal(result, 'Loodle deleted');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

	});

	describe('delete', function () {

		var loodle = {
			'name': 'Mon super loodle',
			'description': 'Ma super description'
		};

		// We need a loodle to play with
		before(function (done) {

			Loodle.createLoodle(riri.id, loodle.name, loodle.description, function (err, data) {
				if (err) return done(err);

				loodle = data;
				return done();
			});

		});

		it('should delete the loodle', function (done) {

			Loodle.delete(loodle.id, function (err, result) {

				try {
					assert.equal(err, null);
					assert.equal(result, 'Loodle deleted');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if the loodle id is unknown', function (done) {

			Loodle.delete('00000000-0000-0000-0000-000000000000', function (err, result) {

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

		it('should send an error if the loodle id is not a valid uuid', function (done) {

			Loodle.delete('abibg', function (err, result) {

				try {
					assert.equal(err.name, 'TypeError');
					assert.equal(err.message, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

	});

	describe('createPublicLoodle', function () {

		var loodle = {
			name: 'My public loodle',
			description: 'Test of the createPublicLoodle functionality',
			schedules: [
				{
					begin_time: '15/02/2016 10:24',
					end_time: '15/02/2016 10:34'
				},
				{
					begin_time: '15/02/2016 10:44',
					end_time: '15/02/2016 10:54'
				}
			],
			locale: 'fr'
		}

		it('should create the public loodle', function (done) {

			Loodle.createPublicLoodle(loodle.name, loodle.description, loodle.schedules, loodle.locale, function (err, data) {

				try {
					assert.equal(err, null);
					assert.equal(data.name, loodle.name);
					assert.equal(data.description, loodle.description);
					assert.equal(data.category, 'public');
					loodle = data;
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

			// Delete the public loodle we created
			after(function (done) {
				Loodle.delete(loodle.id, done);
			});

		});

		it('should send an error if one parameter is missing', function (done) {

			Loodle.createPublicLoodle('', loodle.description, loodle.schedules, loodle.locale, function (err, data) {

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

		it('should send an error if the language is unknown', function (done) {

			var schedules = [
				{
					begin_time: '15/02/2016 10:24',
					end_time: '15/02/2016 10:34'
				},
				{
					begin_time: '15/02/2016 10:24',
					end_time: '15/02/2016 10:34'
				}
			];

			Loodle.createPublicLoodle(loodle.name, loodle.description, schedules, '', function (err, data) {

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

		it('should send an error if no schedule has been specified', function (done) {

			Loodle.createPublicLoodle(loodle.name, loodle.description, [], 'fr', function (err, data) {

				try {
					assert.equal(err.name, 'Error');
					assert.equal(err.message, 'At least one schedule is required');
					assert.equal(data, null);
				}
				catch (e) {
					return done(e);
				}

				return done();

			});

		});

		it('should send an error if one schedule is not on the same day', function (done) {

			var schedules = [
				{
					begin_time: '15/02/2016 10:24',
					end_time: '15/02/2016 10:34'
				},
				{
					begin_time: '15/02/2016 10:24',
					end_time: '16/02/2016 10:34'
				}
			];

			Loodle.createPublicLoodle(loodle.name, loodle.description, schedules, 'fr', function (err, data) {

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

	});

});