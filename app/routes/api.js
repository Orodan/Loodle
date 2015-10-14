var express = require('express');
var router = express.Router();
<<<<<<< HEAD
var passport = require('passport');
var jwt = require('express-jwt');
=======
>>>>>>> origin/dev

var User = require('../controllers/user');
var Loodle = require('../controllers/loodle');

<<<<<<< HEAD
// All the api routes need an acces token, except the route
// to get the token
router.use(jwt({ secret: 'secret'}).unless({path: ['/api/authenticate']}));
router.use(function (err, req, res, next) {

	if (err.name === 'UnauthorizedError') {
		res.status(401);
		res.json({
			type: false,
			data: 'Unauthorized'
		});
	}
=======
var jwt = require('express-jwt');
var secret = require('../../config/secret');

router.use(jwt({ 
    secret: secret
  }).unless({ 
    path : ['/api/authenticate'] 
  }));

router.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {

    res.status(401);
    res.json({
      type: false,
      data: 'Unauthorized'
    });
  }
>>>>>>> origin/dev
});

// GET =============================================

router.get('/loodle/:id', Loodle.get);
router.get('/loodle', Loodle.getLoodlesOfUser);

router.get('/loodle/', Loodle.getLoodlesOfUser);

// POST ============================================

router.post('/authenticate', User.authenticate);

<<<<<<< HEAD
router.post('/loodle', Loodle.createLoodle);
=======
router.post('/loodle'
	// , passport.authenticate('basic', { session: false })
	, jwt({secret: secret})
 	, Loodle.createLoodle
);
>>>>>>> origin/dev

// PUT =============================================

// DELETE ==========================================


module.exports = router;