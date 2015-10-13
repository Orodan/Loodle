var express = require('express');
var router = express.Router();

var User = require('../controllers/user');
var Loodle = require('../controllers/loodle');

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
});

// GET =============================================

router.get('/loodle/:id', Loodle.get);
router.get('/loodle', Loodle.getLoodlesOfUser);

// POST ============================================

router.post('/authenticate', User.authenticate);

router.post('/loodle'
	// , passport.authenticate('basic', { session: false })
	, jwt({secret: secret})
 	, Loodle.createLoodle
);

// PUT =============================================

// DELETE ==========================================


module.exports = router;