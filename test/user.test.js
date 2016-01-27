var assert = require('assert');

describe('User', function () {
	var User = require('../app/controllers/user');

	describe('createUser', function () {
		it('should send back the user data', function (done) {

			var myUser = {
				email: "ririduck@gmail.com",
				first_name: "Riri",
				last_name: "Duck",
				password: "mypassword"
			};

			User.createUser(myUser.email, myUser.first_name, myUser.last_name, myUser.password, function (err, data) {

				assert.equal(data.email,myUser.email);
				assert.equal(data.first_name, myUser.first_name);
				assert.equal(data.last_name, myUser.last_name);
				assert.equal(data.status, 'registred');
				done();

			});
			
		});

		it('should send back an error if the email is already used', function (done) {
			
			var myUser = {
				email: "ririduck@gmail.com",
				first_name: "Riri",
				last_name: "Duck",
				password: "mypassword"
			};

			User.createUser(myUser.email, myUser.first_name, myUser.last_name, myUser.password, function (err, data) {

				assert.equal(err,'This email is already used');
				done();
			});

		});

	});
});