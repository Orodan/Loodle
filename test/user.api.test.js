var assert    = require('assert');
var async     = require('async');
var request   = require('supertest');

var User      = require('../app/controllers/user');

var host = '127.0.0.1:3000';

describe('API User', function () {

    describe('POST /user', function () {

        var fifi = {
            email: 'fifiduck@gmail.com',
            first_name: 'Firi',
            last_name: 'Duck',
            password: 'test'
        };

        after(function (done) {
            User.delete(fifi.id, done);
        });

        it('should create the user', function (done) {

            request(host)
                .post('/api/user')
                .set('Accept', 'application/json')
                .send(fifi)
                .expect(200)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data.email, fifi.email);
                        assert.equal(res.body.data.first_name, fifi.first_name);
                        assert.equal(res.body.data.last_name, fifi.last_name);
                        assert.equal(res.body.data.status, 'registred');

                        fifi = res.body.data;
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the user email is already used', function (done) {

            request(host)
                .post('/api/user')
                .set('Accept', 'application/json')
                .send(fifi)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'This email is already used');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if one parameter is missing', function (done) {

            var loulou = {
                email: 'fifiduck@gmail.com',
                first_name: 'Firi',
                password: 'test'
            }

            request(host)
                .post('/api/user')
                .set('Accept', 'application/json')
                .send(loulou)
                .expect(400)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Last name required');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

    });


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
                        assert.notEqual(res.body.data, null);
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
                        assert.equal(res.body.data, 'No user found');
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
                        assert.equal(res.body.data, 'Email required');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

    });

});