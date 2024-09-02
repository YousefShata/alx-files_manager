const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err.message}`);
      this.isClientConnected = false;
    });
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.isClientConnected;
  }

  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  async set(key, val, duration) {
    await this.setAsync(key, val, 'EX', duration);
  }

  async del(key) {
    await this.delAsync(key);
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
