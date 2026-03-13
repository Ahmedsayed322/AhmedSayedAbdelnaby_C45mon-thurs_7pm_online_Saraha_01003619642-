import { redis_client } from './redis.connection.js';
export const revokedKey = ({ userId, jti }) => {
  const result = `revoked_key::${userId}::${jti}`;
  console.log(result);
  return result;
};
export const getRevokeTokenKey = (userId) => {
  return `revoked_key::${userId}:*`;
};
export const setValue = async ({ key, value, ttl }) => {
  try {
    const data = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      return await redis_client.set(key, data, { EX: ttl });
    }

    return await redis_client.set(key, data);
  } catch (err) {
    console.log('fail to set a value', err);
  }
};

export const getValue = async (key) => {
  try {
    const data = await redis_client.get(key);

    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (err) {
    console.log('fail to get a value', err);
  }
};

export const deleteKey = async (keys) => {
  try {
    if (!keys.length) return;
    return await redis_client.del(...keys);
  } catch (err) {
    console.log('fail to delete a value', err);
  }
};

export const exists = async (key) => {
  try {
    const result = await redis_client.exists(key);
    return result === 1;
  } catch (err) {
    console.log('fail to check key', err);
  }
};
export const getTTL = async (key) => {
  try {
    return await redis_client.ttl(key);
  } catch (err) {
    console.log('fail to get ttl', err);
  }
};
export const update = async ({ key, value, ttl }) => {
  try {
    if (!await redis_client.exists(key)) return;
    return await setValue({ key, value, ttl });
  } catch (err) {
    console.log('fail to update a value', err);
  }
};
