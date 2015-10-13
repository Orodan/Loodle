var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../controllers/user');
var Loodle = require('../controllers/loodle');

// GET =============================================

router.get('/loodle/:id', Loodle.get);

// POST ============================================

router.post('/loodle', Loodle.createLoodle);

// PUT =============================================

// DELETE ==========================================



module.exports = router;