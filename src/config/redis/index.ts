import Redis from 'ioredis';
const redisString = process.env.REDIS_URL as string;
export default new Redis(redisString);

export const removeRedisKeys = async (key: string): Promise<any> => {
  try {
    const matchKeys = [];
    for await (const redisKey of new Redis(redisString).scanStream({
      match: `${key}*`
    })) {
      matchKeys.push(redisKey);
    }
    if (matchKeys.length > 0) {
      new Redis(redisString).del(matchKeys);
    }
  } catch (error) {
    return Promise.reject(error);
  }
};
