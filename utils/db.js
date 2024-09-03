const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const uri = 'mongodb://localhost:27017/files_manager';
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.isConnected = false;
    this.client.connect()
      .then(() => {
        this.isConnected = true;
        this.db = this.client.db('files_manager');
      })
      .catch(() => {
        this.isConnected = false;
      });
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    const coll = this.db.collection('users');
    return coll.countDocuments();
  }

  async nbFiles() {
    const coll = this.db.collection('files');
    return coll.countDocuments();
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
