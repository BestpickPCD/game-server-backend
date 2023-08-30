import Redis from 'ioredis';
const redis = new Redis({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT)
});
export default redis;

redis.on('connect', () => {
  console.log('Redis connected');
});
redis.on('error', () => {
  console.log('Redis error');
});

export const removeRedisKeys = async (key: string): Promise<any> => {
  try {
    const matchKeys = [];
    for await (const redisKey of redis.scanStream({
      match: `${key}*`
    })) {
      matchKeys.push(redisKey);
    }
    if (matchKeys.length > 0) {
      redis.del(matchKeys);
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

export const getRedisData = async (
  id: number,
  name: string,
  invalidMessage: string
): Promise<any> => {
  try {
    if (!Number(id)) {
      throw Error(invalidMessage);
    }
    const redisKeyWithId = `${name}-${id}`;
    const redisData = await redis.get(redisKeyWithId);

    return { redisData, redisKeyWithId };
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
};
