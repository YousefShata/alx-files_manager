import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = require('mongodb');

class UsersController {
  static async postNew(req, res) {
    const newUser = req.body;

    try {
      // Validate email
      if (!newUser.email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      // Validate password
      if (!newUser.password) {
        return res.status(400).json({ error: 'Missing Password' });
      }

      // Check if user already exists
      const user = await dbClient.db.collection('users').findOne({ email: newUser.email });
      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password
      const hashedPassword = crypto.createHash('sha1').update(newUser.password).digest('hex');
      newUser.password = hashedPassword;

      const result = await dbClient.db.collection('users').insertOne(newUser);
      return res.status(201).json({
        id: result.insertedId,
        email: newUser.email,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const foundToken = await redisClient.get(`auth_${token}`);
    if (!foundToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const objectId = new ObjectId(foundToken);

    const object = await dbClient.db.collection('users').findOne({ _id: objectId });
    return res.json({ id: object._id, email: object.email });
  }
}

module.exports = UsersController;
