import { createClient } from 'redis';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function connectToRedis() {
  const redisClient = createClient({
    url: process.env.REDIS_URL
  });
  // Handle errors
  redisClient.on('error', (error) => {
    console.error('Redis error:', error);
  });

  return redisClient;
}

export default connectToRedis;
export const removeRedisKeys = async (key: string): Promise<any> => {
  const redisClient = await connectToRedis();
  await redisClient.connect();
  try {
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
