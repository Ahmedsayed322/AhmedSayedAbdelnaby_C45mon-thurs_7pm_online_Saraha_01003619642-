import {
  generateKeyPairSync,
  constants,
  publicEncrypt,
  privateDecrypt,
} from 'crypto';
import { resolve } from 'path';
import fs from 'fs/promises';
export const runForFirstTime = async () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  try {
    await fs.mkdir(resolve('./src/config/security'), { recursive: true });
    await fs.writeFile(
      resolve('./src/config/security/public.bem'),
      publicKey.export({ type: 'pkcs1', format: 'pem' }),
      { flag: 'wx' },
    );
    await fs.writeFile(
      resolve('./src/config/security/private.bem'),
      privateKey.export({ type: 'pkcs1', format: 'pem' }),
      { flag: 'wx' },
    );
    console.log('files created successfully');
  } catch (e) {
    if (e.code === 'EEXIST') {
      console.log('files already exists skipping....');
    }
  }
};
////////////////////////////
const publicKey = await fs.readFile(
  resolve('./src/config/security/public.bem'),
);
const privateKey = await fs.readFile(
  resolve('./src/config/security/private.bem'),
);
/////////////////////////////////////////
export const Encryption = async (data) => {
  const encrypted = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(data),
  );
  return encrypted.toString('base64');
};
//////////////////////////////////////////////
export const Decryption = async (encryptedData) => {
  const buffer = Buffer.from(encryptedData, 'base64');
  const decrypted = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
    },
    buffer,
  );
  return decrypted.toString('utf8')
};
