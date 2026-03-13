import { env } from '../../config/index.js';
import { dbService, redis_client, USER } from '../../DB/index.js';
import {
  ApiError,
  asymmetric,
  hashSecurity,
  mailService,
  otpTypes,
  pages,
  provider,
} from '../../utils/index.js';
import { OAuth2Client } from 'google-auth-library';

import cloudinary from '../../utils/cloudinary/cloudinary.js';
import {
  Decryption,
  Encryption,
} from '../../utils/security/asymmetricEncryption.security.js';
import { randomUUID } from 'crypto';
import {
  deleteKey,
  getRevokeTokenKey,
  getValue,
  revokedKey,
  setValue,
} from '../../DB/redis/redis.service.js';

export const signup = async (req) => {
  const { firstName, lastName, email, password, phone } = req.body;
  const exists = await dbService.findOneDoc(USER, { filter: { email } });
  if (exists) {
    throw new ApiError('this email already exists', 409);
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('otp : ', otp);
  const hashedOTP = await hashSecurity.hash(otp, 'bcrypt');
  await setValue({
    key: `create::${email}`,
    value: {
      firstName,
      lastName,
      email,
      password,
      phone,
    },
    ttl: 300,
  });
  await setValue({
    key: `otp::${email}`,
    value: hashedOTP,
    ttl: 300,
  });
  await mailService.sendOTP(
    email,
    'Confirm Your Email',
    'Your OTP',
    pages.otpPage(otp),
  );
};
export const confirmAccount = async (data) => {
  const { email, otp } = data;
  const user = await getValue(`create::${email}`);
  const hashedOTP = await getValue(`otp::${email}`);
  if (!hashedOTP || !user) {
    throw new ApiError('OTP expired ', 400);
  }
  const isValid = await hashSecurity.checkHash(
    otp.toString(),
    hashedOTP,
    'bcrypt',
  );
  if (!isValid) {
    throw new ApiError('invalid OTP ', 400);
  }
  await dbService.createDoc(USER, {
    data: user,
  });
  await deleteKey(`otp::${email}`);
  await deleteKey(`create::${email}`);
};
export const login = async (data) => {
  const { email, password } = data;
  const user = await dbService.findOneDoc(USER, {
    filter: { email, password: { $exists: 1 } },
  });
  if (!user) {
    throw new ApiError('invalid email or password', 401);
  }
  const checkPassword = await hashSecurity.checkHash(
    password,
    user.password,
    'argon',
  );
  if (!checkPassword) {
    throw new ApiError('invalid email or password', 401);
  }
  const tokenId = randomUUID();
  const accessToken = await user.generateToken('access', tokenId);
  const refreshToken = await user.generateToken('refresh', tokenId);
  return { accessToken, refreshToken };
};
const verifyGmail = async (idToken) => {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.CLIENT_IDS,
  });
  const payload = ticket.getPayload();
  if (!payload.email_verified) {
    throw new ApiError('failed to verify this account', 400);
  }
  return payload;
};
export const GmailSignUp = async ({ idToken }) => {
  const payload = await verifyGmail(idToken);
  const { email, email_verified, name, picture } = payload;
  const chkEmail = await dbService.findOneDoc(USER, {
    filter: {
      email,
    },
  });
  const tokenId = randomUUID();
  if (chkEmail) {
    if (chkEmail.provider === provider.google) {
      const accessToken = await chkEmail.generateToken('access', tokenId);
      const refreshToken = await chkEmail.generateToken('refresh', tokenId);
      return { accessToken, refreshToken, created: false };
    }
    throw new ApiError('please login with email and password', 400);
  }
  const newUser = await dbService.createDoc(USER, {
    data: {
      email,
      fullName: name,
      provider: provider.google,
      isConfirmed: email_verified ? true : undefined,
      profilePic: picture,
    },
  });

  const accessToken = await newUser.generateToken('access', tokenId);
  const refreshToken = await newUser.generateToken('refresh', tokenId);
  return { accessToken, refreshToken, created: true };
};
export const uploadPic = async (req) => {
  const { public_id, secure_url } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: 'profilePics',
      public_id: `${req.user._id}_${Date.now()}`,
      use_filename: true,
    },
  );
  if (req.user.profilePic?.public_id) {
    const galleryPic = await cloudinary.uploader.upload(
      req.user.profilePic.secure_url,
      {
        folder: 'gallery',
        public_id: req.user.profilePic.public_id.split('/')[1],
        use_filename: true,
      },
    );
    const result = await cloudinary.uploader.destroy(
      req.user.profilePic.public_id,
    );
    req.user.gallery.push({
      public_id: galleryPic.public_id,
      secure_url: galleryPic.secure_url,
    });
  }
  req.file.profilePicId = public_id;
  req.user.profilePic = {
    public_id,
    secure_url,
  };
  await req.user.save();
};
export const refreshToken = async ({ decoded }) => {
  const user = await dbService.findOneDoc(USER, {
    filter: { _id: decoded.id },
  });
  if (!user) {
    throw new ApiError('invalid refresh token', 401);
  }
  const accessToken = await user.generateToken('access', decoded.jti);
  return accessToken;
};
export const shareProfile = async (userId) => {
  const user = await dbService.findDocById(USER, {
    id: userId,
    select: [
      'firstName',
      'lastName',
      'fullName',
      'email',
      'phone',
      'profilePic',
      'visitCount',
    ],
  });
  if (!user) {
    throw new ApiError('user not found', 404);
  }
  await dbService.updateOneDoc(USER, {
    filter: { _id: userId },
    update: { $inc: { visitCount: 1 } },
  });
  const userObj = user.toObject();
  userObj.phone = await Decryption(userObj.phone);
  delete userObj.visitCount;
  return userObj;
};
export const updateProfile = async (req) => {
  await dbService.updateOneDoc(USER, {
    filter: { _id: req.user._id },
    update: {
      ...req.body,
      phone: req.body.phone
        ? await asymmetric.Encryption(req.body.phone)
        : undefined,
    },
  });
  const user = await dbService.findDocById(USER, {
    id: req.user._id,
    select: ['-__v', '-createdAt', '-updatedAt', '-password'],
  });
  user.phone = await asymmetric.Decryption(user.phone);
  const userObj = user.toObject();
  delete userObj.visitCount;
  delete userObj.password;
  await setValue({
    key: `profile::${user.id}`,
    value: userObj,
    ttl: 120,
  });
};
export const updatePassword = async (req) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const chkPassword = await hashSecurity.checkHash(
    currentPassword,
    req.user.password,
    'argon',
  );
  if (!chkPassword) {
    throw new ApiError('invalid current password', 400);
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError('new password and confirm password do not match', 400);
  }
  req.user.password = newPassword;
  await req.user.save();
};
export const logout = async ({ user, query, decoded }) => {
  const { flag } = query;
  if (flag === 'all') {
    user.changeCredentials = Date.now();
    await user.save();
    await deleteKey(await redis_client.keys(getRevokeTokenKey(user._id)));
    return;
  }
  await setValue({
    key: revokedKey({ userId: user.id, jti: decoded.jti }),
    value: `${decoded.jti}`,
    ttl: decoded.exp - Math.floor(Date.now() / 1000),
  });
};
export const userProfile = async (user) => {
  const exist = await getValue(`profile::${user.id}`);
  if (exist) {
    console.log('data from here');
    return exist;
  }
  const userObj = user.toObject();
  delete userObj.visitCount;
  delete userObj.password;
  await setValue({
    key: `profile::${user.id}`,
    value: userObj,
    ttl: 120,
  });
  return userObj;
};
export const removeProfilePicture = async (user) => {
  await cloudinary.uploader.destroy(user.profilePic.public_id);
  user.profilePic = undefined;
  await user.save();
  //unlink for HD
};
export const getViewCount = async (userId) => {
  const visitCount = await dbService.findDocById(USER, {
    id: userId,
    select: ['visitCount', 'firstName', 'lastName'],
  });
  if (!visitCount) {
    throw new ApiError('user not found', 404);
  }
  return visitCount;
};
export const uploadCoverPics = async (req) => {
  const numOfFiles = req.files?.length;
  const coverPicsCount = req.user.coverPics?.length || 0;

  if (coverPicsCount + numOfFiles !== 2) {
    throw new ApiError(
      'Total number of cover pictures must equal exactly 2',
      400,
    );
  }

  for (const file of req.files) {
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: 'coverPics',
      },
    );
    req.user.coverPics.push({ public_id, secure_url });
  }

  await req.user.save();
};
