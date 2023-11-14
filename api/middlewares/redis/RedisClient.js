const { createClient } = require("redis");

class RedisClient {
    redisClient = null;
    constructor() {
        this._connect();
    }
    async _connect() {
        const client = createClient({
            url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        });
        client.on("error", (err) => console.log("Redis Client Error", err));
        await client.connect();

        this.redisClient = client;
        console.log("Redis client connect successfully.");
    }
    
    set(key, value, options = {}) {
        this.redisClient.set(key, value, options);
    }
    get(key) {
        return this.redisClient.get(key);
    }
    del(keys) {
        return this.redisClient.del(keys);
    }
    keys(pattern){
        return this.redisClient.keys(pattern)
    }
}

module.exports = new RedisClient();
