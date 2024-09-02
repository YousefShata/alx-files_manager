const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const uri = 'mongodb://localhost:27017/files_manager';
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.isConnected = true;
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
    const coll = this.client.collection('users');
    coll.count().then((count) => count);
  }

  async nbFiles() {
    const coll = this.client.collection('files');
    coll.count().then((count) => count);
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
