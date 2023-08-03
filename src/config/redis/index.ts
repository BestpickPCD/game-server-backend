import { createClient } from 'redis';
const redisClient = createClient({
  url: process.env.REDIS_URL
});
export const removeRedisKeys = async (key: string): Promise<any> => {
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
  }
};
export default redisClient;
