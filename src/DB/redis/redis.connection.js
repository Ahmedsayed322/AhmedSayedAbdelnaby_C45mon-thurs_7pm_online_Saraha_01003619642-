import { createClient } from 'redis';
import { env } from '../../config/index.js';

export const redis_client = createClient({
  url: env.REDIS_URL,
});
export const redis_connection = async () => {
  await redis_client
    .connect()
    .then(() => {
      console.log('connected to Redis Successfully');
    })
    .catch((err) => {
      console.log('connected to Redis failed', err);
    });
};
