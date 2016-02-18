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

    describe('POST /loodle/:loodleId/user/:userId', function () {

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
            name: 'My great loodle',
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

        it('should send an error if the loodle id is not a valid uuid', function (done) {

            request(host)
                .post('/api/loodle/' + 'gheghe' + '/user/' + fifi.id)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the loodle id is unknown', function (done) {

            request(host)
                .post('/api/loodle/' + '00000000-0000-0000-0000-000000000000' + '/user/' + fifi.id)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Unknown loodle id');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the user id is not a valid uuid', function (done) {

            request(host)
                .post('/api/loodle/' + loodle.id + '/user/' + 'fhzogho')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the user id is unknown', function (done) {

            request(host)
                .post('/api/loodle/' + loodle.id + '/user/' + '00000000-0000-0000-0000-000000000000')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Unknown user id');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

    });

    describe('/loodle/:id/schedule', function () {

        var riri = {
            email: "ririduck@gmail.com",
            first_name: "Riri",
            last_name: "Duck",
            password: "test"
        };

        var loodle = {
            'name': 'Mon super loodle',
            'description': 'Ma super description'
        };

        var token;

        // Create an user, get an access token and create a loodle
        before(function (done) {

            async.series({

                // Create users
                createRiri: function (end) {
                    User.createUser(riri.email, riri.first_name, riri.last_name, riri.password, function (err, data) {
                        if (err) return end(err);

                        riri.id = data.id;
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
                deleteRiri: async.apply(User.delete, riri.id)
            }, done);

        });

        it('should add the schedule', function (done) {

            var schedule = {
                begin_time: '10/02/2016 17:10',
                end_time: '10/02/2016 17:20',
                language: 'fr'
            };

            request(host)
                .post('/api/loodle/' + loodle.id + '/schedule')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(schedule)
                .expect(200)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Schedule added');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if one parameter is missing', function (done) {

            var schedule = {
                begin_time: '10/02/2016 17:10',
                language: 'fr'
            };

            request(host)
                .post('/api/loodle/' + loodle.id + '/schedule')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(schedule)
                .expect(400)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Attribute "end_time" required');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the language is unknown', function (done) {

            var schedule = {
                begin_time: '10/02/2016 17:10',
                end_time: '10/02/2016 17:20',
                language: 'zbzeihbf'
            };

            request(host)
                .post('/api/loodle/' + loodle.id + '/schedule')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(schedule)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Unknown language');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the schedule is not on the same day', function (done) {

            var schedule = {
                begin_time: '10/02/2016 17:10',
                end_time: '10/03/2016 17:20',
                language: 'fr'
            };

            request(host)
                .post('/api/loodle/' + loodle.id + '/schedule')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(schedule)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Schedule is not on the same day');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the loodle id is unknown', function (done) {

            var schedule = {
                begin_time: '10/02/2016 17:10',
                end_time: '10/02/2016 17:20',
                language: 'fr'
            };

            request(host)
                .post('/api/loodle/' + '00000000-0000-0000-0000-000000000000' + '/schedule')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(schedule)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Unknown loodle id');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

        it('should send an error if the loodle id is not a valid uuid', function (done) {

            var schedule = {
                begin_time: '10/02/2016 17:10',
                end_time: '10/02/2016 17:20',
                language: 'fr'
            };

            request(host)
                .post('/api/loodle/' + 'gbgjieb' + '/schedule')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .send(schedule)
                .expect(500)
                .end(function (err, res) {
                    try {
                        assert.equal(err, null);
                        assert.equal(res.body.data, 'Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000');
                    }
                    catch (e) {
                        return done(e);
                    }

                    return done();
                });

        });

    });
});
