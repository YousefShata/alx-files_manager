const express = require('express');
import AppController from '../controllers/AppController';
import UserController from '../controllers/UserController';


const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/users', UserController.postNew);

module.exports = router;
