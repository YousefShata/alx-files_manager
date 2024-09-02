const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const uri = 'mongodb://localhost:27017/files_manager';
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.isConnected = false;
    this.client.connect()
      .then(() => {
        this.isConnected = true;
      })
      .catch(() => {
        this.isConnected = false;
      });
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    const db = this.client.db('files_manager');
    const coll = db.collection('users');
    return coll.countDocuments();
  }

  async nbFiles() {
    const db = this.client.db('files_manager');
    const coll = db.collection('files');
    return coll.countDocuments();
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
