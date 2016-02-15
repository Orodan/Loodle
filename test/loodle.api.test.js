var assert    = require('assert');
var async     = require('async');
var request   = require('supertest');

var User      = require('../app/controllers/user');

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

});