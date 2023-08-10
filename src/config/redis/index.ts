import { createClient } from 'redis';
const redisClient = createClient({
  url: process.env.REDIS_URL
});
redisClient.on('connect', () => {
  console.log('Connected to Redis server');
});

redisClient.on('error', (err) => {
  console.log(err.message);
});

redisClient.on('ready', () => {
  console.log('Redis is ready');
});

redisClient.on('end', () => {
  console.log('Redis connection ended');
});

process.on('SIGINT', () => {
  redisClient.quit();
});

redisClient
  .connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch((err) => {
    console.log(err.message);
  });

export default redisClient;
export const removeRedisKeys = async (key: string): Promise<any> => {
  try {
    await redisClient.connect();
    const matchKeys = [];
    for await (const redisKey of redisClient.scanIterator({
      TYPE: 'string', // `SCAN` only
      MATCH: `${key}*`
    })) {
      matchKeys.push(redisKey);
    }
    if (matchKeys.length > 0) {
      redisClient.del(matchKeys);
    }
  } catch (error) {
    return Promise.reject(error);
  } finally {
    await redisClient.quit();
  }
};
