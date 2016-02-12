var assert    = require('assert');
var async     = require('async');

var Loodle    = require('../app/controllers/loodle');
var User      = require('../app/controllers/user');
var Vote = require('../app/controllers/vote');

describe('Vote', function () {

	var riri = {
		email: "ririduck@gmail.com",
		first_name: "Riri",
		last_name: "Duck",
		password: "mypassword"
	};

	// We need a user to play with
	before(function (done) {

        User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {
            if (err) return done(err);

            riri = data;
            return done();
        });

	});

    after(function (done) {
        User.delete(riri.id, done);
    });

    describe('updateVotes', function () {

        var loodle = {
            'name': 'Mon super loodle',
            'description': 'Ma super description'
        };

    	// We need a loodle to play with
    	before(function (done) {

            async.series({

                // Create the loodle
                createLoodle: function (end) {
                    Loodle.createLoodle(riri.id, loodle.name, loodle.description, function (err, data) {
                        if (err) return end(err);

                        loodle = data;
                        return end();
                    });
                },

                // Add a schedule
                addSchedule: function (end) {
                    Loodle.addSchedule(loodle.id, '10/02/2016 17:10', '10/02/2016 17:12', 'fr', end);
                },

                // Get the loodle data
                getLoodleData: function (end) {
                    Loodle.get(loodle.id, function (err, data) {
                        if (err) return end(err);

                        loodle = data;
                        return end();
                    });
                }

            }, done);

    	});

        // Delete the loodle we created
    	after(function (done) {
            Loodle.delete(loodle.id, done);
    	});

    	it('should update the vote(s) of the user', function (done) {

            var votes = [{
                id: loodle.votes[0].vote_id,
                vote: 1
            }];

            Vote.updateVotes(loodle.id, riri.id, votes, function (err, data) {

                try {
                    assert.equal(err, null);
                    assert.equal(data, 'Vote(s) updated');
                }
                catch (e) {
                    return done(e);
                }

                return done();

            });

        });

        it('should send an error if the vote value is not 0 nor 1', function (done) {

            var votes = [{
                id: loodle.votes[0].vote_id,
                vote: 2
            }];

            Vote.updateVotes(loodle.id, riri.id, votes, function (err, data) {

                try {
                    assert.equal(err.name, 'RangeError');
                    assert.equal(err.message, 'Vote value should be 0 or 1');
                    assert.equal(data, null);
                }
                catch (e) {
                    return done(e);
                }

                return done();

            });

        });

    	it('should send an error if the loodle id is unknown', function (done) {

            Vote.updateVotes('00000000-0000-0000-0000-000000000000', riri.id, [], function (err, data) {

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

            Vote.updateVotes('uhguhgo', riri.id, [], function (err, data) {

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

    	it('should send an error if the user id is unknown', function (done) {

            Vote.updateVotes(loodle.id, '00000000-0000-0000-0000-000000000000', [], function (err, data) {

                try {
                    assert.equal(err.name, 'ReferenceError');
                    assert.equal(err.message, 'Unknown user id');
                    assert.equal(data, null);
                }
                catch (e) {
                    return done(e);
                }

                return done();

            });

        });

    	it('should send an error if the user id is not a valid uuid', function (done) {

            Vote.updateVotes(loodle.id, 'uhguhgo', [], function (err, data) {

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

    	it('should send an error if one of the vote ids is unknown', function (done) {

            var votes = [{
                id: '00000000-0000-0000-0000-000000000000',
                vote: 1
            }];

            Vote.updateVotes(loodle.id, riri.id, votes, function (err, data) {

                try {
                    assert.equal(err.name, 'ReferenceError');
                    assert.equal(err.message, 'Unknown vote id');
                    assert.equal(data, null);
                }
                catch (e) {
                    return done(e);
                }

                return done();

            });

        });

    	it('should send an error if one of the vote ids is not a valid uuid', function (done) {

            var votes = [{
                id: 'heogeo',
                vote: 1
            }];

            Vote.updateVotes(loodle.id, riri.id, votes, function (err, data) {

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