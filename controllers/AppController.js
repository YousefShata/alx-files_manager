import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const getStatus = (req, res) => {
  const data = {
    redis: redisClient.isAlive(),
    db: dbClient.isAlive(),
  };
  res.status(200).json(data);
};

const getStats = async (req, res) => {
  const counts = {
    users: await dbClient.nbUsers,
    files: await dbClient.nbFiles,
  };

  res.status(200).json(counts);
};

module.exports = {
  getStatus,
  getStats,
};
