var assert    = require('assert');
var async     = require('async');
var request   = require('supertest');

var User      = require('../app/controllers/user');
var Loodle    = require('../app/controllers/loodle');

var host = '127.0.0.1:3000';

describe('API Loodle', function () {

    describe('POST /loodle', function () {

        var riri = {
            email: "ririduck@gmail.com",
            first_name: "Riri",
            last_name: "Duck",
            password: "test"
        };
        var result;

        var token;

        // Create a user and get an access token
        before(function (done) {

            async.series({

                // Create the user
                createUser: function (end) {
                    User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {
                        if (err) return end(err);

                        result = data;
                        return end();
                    });
                },

                // Connect to get the access token
                connect: function (end) {
                    User.authenticate(riri.email, riri.password, function (err, data) {
                        if (err) return end(err);

                        token = data;
                        return end();
                    });
                }

            }, done);

        });

        after(function (done) {
           User.delete(result.id, done);
        });

        it('should create the loodle', function (done) {

            var loodle = {
                name: 'Mon super doodle',
                description: 'test'
            };

            request(host)
                .post('/api/loodle')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(loodle)
                .expect(200)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data.name, loodle.name);
                        assert.equal(res.body.data.description, loodle.description);
                        assert.equal(res.body.data.category, 'private');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the name is missing', function (done) {

            var loodle = {
                description: 'test'
            };

            request(host)
                .post('/api/loodle')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(loodle)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Missing one parameter');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

    });

    describe('POST /loodle/:id/user', function () {

        var riri = {
            email: "ririduck@gmail.com",
            first_name: "Riri",
            last_name: "Duck",
            password: "test"
        };

        var fifi = {
            email: "fifiduck@gmail.com",
            first_name: "Fifi",
            last_name: "Duck",
            password: "test"
        }

        var loodle = {
            name: 'Mon great loodle',
            description: 'Test'
        };

        var token;

        // Create two users, get an access token and create a loodle
        before(function (done) {

            async.series({

                // Create users
                createUsers: function (end) {
                    async.parallel({

                        createRiri: function (finish) {
                            User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {
                                if (err) return finish(err);

                                riri.id = data.id;
                                return finish();
                            });
                        },

                        createFifi: function (finish) {
                            User.createUser(fifi.email, fifi.first_name, fifi.last_name, fifi.password, function (err, data) {
                                if (err) return finish(err);

                                fifi.id = data.id;
                                return finish();
                            });
                        }

                    }, end);
                },

                // Connect to get the access token
                connect: function (end) {
                    User.authenticate(riri.email, riri.password, function (err, data) {
                        if (err) return end(err);

                        token = data;
                        return end();
                    });
                },

                // Create loodle
                createLoodle: function (end) {
                    Loodle.createLoodle(riri.id, loodle.name, loodle.description, function (err, data) {
                       if (err) return end(err);

                        loodle = data;
                        return end();
                    });
                }

            }, done);

        });

        // Delete the created loodle and user
        after(function (done) {

            async.series({
                deleteLoodle: async.apply(Loodle.delete, loodle.id),
                deleteRiri: async.apply(User.delete, riri.id),
                deleteFifi: async.apply(User.delete, fifi.id)
            }, done);

        });

        it('should add the user', function (done) {

            request(host)
                .post('/api/loodle/' + loodle.id + '/user/' + fifi.id)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(loodle)
                .expect(200)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'User added');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the loodle id is not a valid uuid');

        it('should send an error if the user id is not a valid uuid');

    });

});
