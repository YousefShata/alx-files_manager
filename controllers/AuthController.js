import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeaderList = req.headers.authorization.split(' ');
    if (authHeaderList[0] === 'Basic') {
      const authString = authHeaderList[1];
      const buffer = Buffer.from(authString, 'base64');
      const string64 = buffer.toString('ascii');
      const [email, password] = string64.split(':');
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      try {
        const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = uuid();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 86400);

        return res.status(200).json({ token });
      } catch (err) {
        return res.status(500).json({ error: err });
      }
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const foundToken = await redisClient.get(`auth_${token}`);
    if (!foundToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}
module.exports = AuthController;
