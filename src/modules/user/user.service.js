import { env } from '../../config/index.js';
import { dbService, OTP, USER } from '../../DB/index.js';
import {
  ApiError,
  hashSecurity,
  mailService,
  otpTypes,
  pages,
  provider,
} from '../../utils/index.js';
import { OAuth2Client } from 'google-auth-library';

export const signup = async (data) => {
  const { firstName, lastName, email, password, cPassword, phone } = data;

  const exists = await dbService.findOneDoc(USER, { filter: { email } });
  console.log(email, exists);

  if (exists) {
    throw new ApiError('this email already exists', 409);
  }
  if (cPassword !== password) {
    throw new ApiError("confirm password doesn't match password", 400);
  }
  const expireTime = new Date(Date.now() + 10 * 60 * 1000);

  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log('otp : ', otp);
  //el hash by7sl f el pre save w el encryption by7sl f el phone f el pre save
  const user = await dbService.createDoc(USER, {
    data: {
      firstName,
      lastName,
      email,
      password,
      phone,
      expireAt: expireTime,
    },
  });
  await dbService.createDoc(OTP, {
    data: {
      otpType: otpTypes.confirmEmail,
      otp,
      userId: user._id,
      expireAt: expireTime,
    },
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
  const user = await dbService.findOneDoc(USER, { filter: { email } });
  if (!user) {
    throw new ApiError('email not found', 404);
  }
  const otpDoc = await dbService.findOneDoc(OTP, {
    filter: { userId: user._id, otpType: otpTypes.confirmEmail },
  });
  if (!otpDoc) {
    throw new ApiError('invalid OTP ', 400);
  }
  const decryptedOTP = await hashSecurity.checkHash(otp, otpDoc.otp, 'bcrypt');
  if (!decryptedOTP) {
    throw new ApiError('invalid OTP ', 400);
  }
  await dbService.deleteOneDoc(OTP, { filter: { _id: otpDoc._id } });
  await dbService.updateOneDoc(USER, {
    filter: { _id: user._id },
    update: {
      isConfirmed: true,
      $unset: { expireAt: '' },
    },
  });
};
export const login = async (data) => {
  const { email, password } = data;

  const user = await dbService.findOneDoc(USER, {
    filter: { email, password: { $exists: 1 } },
  });
  console.log(user);

  if (!user) {
    throw new ApiError('invalid email or password', 401);
  }
  if (!user.isConfirmed) {
    throw new ApiError('please confirm your email first', 403);
  }
  const checkPassword = await hashSecurity.checkHash(
    password,
    user.password,
    'argon',
  );

  if (!checkPassword) {
    throw new ApiError('invalid email or password', 401);
  }
  const token = await user.generateToken();
  return token;
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
  if (chkEmail) {
    if (chkEmail.provider === provider.google) {
      const token = await chkEmail.generateToken();
      return { token, created: false };
    }
    throw new ApiError('please login with email and password', 400);
  }
  const newUser = await dbService.createDoc(USER, {
    data: {
      email,
      fullName: name,
      provider: provider.google,

      isConfirmed: email_verified,
      profilePic: picture,
    },
  });
  const token = await newUser.generateToken();
  return { token, created: true };
};
