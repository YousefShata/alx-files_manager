import redisClient from '../utils/redis' 
import dbClient from '../utils/db'
const express = require('express');
const app = express();

const getStatus = (req, res) => {
	const data = {
		'redis': redisClient.isAlive(),
		'db': dbClient.isAlive()
	}
	res.status(200).json(data);
}

const getStats = (req, res) => {
	const counts = {
		'users': dbclient.nbUsers,
		'files': dbClient.nbFiles
	}

	res.status(200).json(counts);
}

module.exports = {
	getStatus,
	getStats
}
