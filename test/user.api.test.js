var assert    = require('assert');
var async     = require('async');
var request   = require('supertest');
var http      = require('http');

var User      = require('../app/controllers/user');

var host = '127.0.0.1:3000';

describe('API User', function () {

    describe('POST /authenticate', function () {

        var riri = {
            email: "ririduck@gmail.com",
            first_name: "Riri",
            last_name: "Duck",
            password: "test"
        }

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

        it('should authenticate the user', function (done) {

            var data = {
                email: 'ririduck@gmail.com',
                password: 'test'
            };

            request(host)
                .post('/api/authenticate')
                .set('Accept', 'application/json')
                .send(data)
                .expect(200)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.notEqual(res.body, null);
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the user credentials are unknown', function (done) {

            var data = {
                email: 'tegteitbi@gmail.com',
                password: 'test'
            };

            request(host)
                .post('/api/authenticate')
                .set('Accept', 'application/json')
                .send(data)
                .expect(404)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body, 'No user found');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if one parameter is missing', function (done) {

            var data = {
                password: 'test'
            };

            request(host)
                .post('/api/authenticate')
                .set('Accept', 'application/json')
                .send(data)
                .expect(400)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body, 'Email required');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

    });


});