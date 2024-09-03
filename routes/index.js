const { getStatus, getStats } = require('../controller/AppController');
const express = require('express');
const router = express.Router();

router.get('/status', getStatus);
router.get('/stats', getStats);

module.exports = router;
