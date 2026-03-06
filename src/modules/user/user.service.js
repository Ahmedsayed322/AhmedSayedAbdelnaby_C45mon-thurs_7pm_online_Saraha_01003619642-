import { env } from '../../config/index.js';
import { dbService, OTP, USER } from '../../DB/index.js';
import jwt from 'jsonwebtoken';
import {
  ApiError,
  hashSecurity,
  mailService,
  otpTypes,
  pages,
  provider,
} from '../../utils/index.js';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { unlink } from 'fs/promises';
import cloudinary from '../../utils/cloudinary/cloudinary.js';
import {
  Decryption,
  Encryption,
} from '../../utils/security/asymmetricEncryption.security.js';


export const signup = async (req) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const exists = await dbService.findOneDoc(USER, { filter: { email } });
  console.log(email, exists);

  if (exists) {
    throw new ApiError('this email already exists', 409);
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
  const accessToken = await user.generateToken('access');
  const refreshToken = await user.generateToken('refresh');
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
      isConfirmed: email_verified ? true : undefined,
      profilePic: picture,
    },
  });
  const token = await newUser.generateToken();
  return { token, created: true };
};
// export const uploadPic = async (req) => {
//   if (req.user.profilePic) {
//     try {
//       const url = new URL(req.user.profilePic);
//       const pathname = url.pathname;
//       const filePath = path.join(process.cwd(), pathname);
//       await unlink(filePath);
//     } catch (e) {
//       console.log('file already deleted skip.....');
//     }
//   }

//   let profilePic = `${req.protocol}://${req.host}/${req.file.destination}/${req.file.filename}`;
//   req.user.profilePic = profilePic;
//   await req.user.save();
//   return;
// };
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
    await cloudinary.uploader.destroy(req.user.profilePic.public_id);
  }
  req.file.profilePicId = public_id;
  req.user.profilePic = {
    public_id,
    secure_url,
  };
  await req.user.save();
};
export const refreshToken = async ({ refreshToken }) => {
  const payload = await jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
  const user = await dbService.findOneDoc(USER, {
    filter: { _id: payload.id },
  });
  if (!user) {
    throw new ApiError('invalid refresh token', 401);
  }
  const accessToken = await user.generateToken('access');
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
    ],
  });
  if (!user) {
    throw new ApiError('user not found', 404);
  }
  user.phone = await Decryption(user.phone);
  return user;
};

export const updateProfile = async (req) => {
  USER.updateOne({}, {}, {});
  const user = await dbService.updateOneDoc(USER, {
    filter: { _id: req.user._id },
    update: {
      ...req.body,
      phone: req.body.phone ? await Encryption(req.body.phone) : undefined,
    },
  });
  if (!user) {
    throw new ApiError('user not found', 404);
  }
  return user;
};
export const updatePassword = async (req) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  console.log(req.user);

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
