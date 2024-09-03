import dbClient from '../utils/db';

class UserController {
  static async postNew(req, res) {
    const newUser = req.body;
    try {
      if (newUser.email == null) {
        res.status(400).json({
          error: 'Missing email',
        });
      }
      if (newUser.password == null) {
        res.status(400).json({
          error: 'Missing Password',
        });
      }
      const user = await dbClient.collection('users').findOne({ email: newUser.email });
      if (user) {
        res.status(400).json({
          error: 'Already exist',
        });
      }
      const result = await dbClient.client.collection('users').insertOne(newUser);
      res.status(201).json({
        id: result.insertedId,
        email: result.email,
      });
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = UserController;
