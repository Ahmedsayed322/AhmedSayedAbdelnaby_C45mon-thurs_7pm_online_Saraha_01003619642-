import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt';
import { hash as argonHash, verify } from 'argon2';
import { env } from '../../config/index.js';

export const hash = async (password, algo = 'bcrypt') => {
  let result;
  switch (algo) {
    case 'bcrypt':
      const salt = env.SALT;
      result = await bcryptHash(password, salt);
      break;
    case 'argon':
      result = await argonHash(password);
      break;
    default:
      throw new Error(`Unsupported hashing algorithm: ${algo}`);
  }
  return result;
};
export const checkHash = async (plainText, cipherText, algo = 'bcrypt') => {
  let result;
  switch (algo) {
    case 'bcrypt':
      result = await bcryptCompare(plainText, cipherText);
      break;
    case 'argon':
      result = await verify(cipherText, plainText);
      break;
    default:
      throw new Error(`Unsupported hashing algorithm: ${algo}`);
  }
  return result;
};
