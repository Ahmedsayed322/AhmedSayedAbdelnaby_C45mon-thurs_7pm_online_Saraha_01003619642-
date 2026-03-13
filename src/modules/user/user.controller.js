import { Router } from 'express';
import { successResponse } from '../../utils/index.js';
import {
  confirmAccount,
  getViewCount,
  GmailSignUp,
  login,
  logout,
  refreshToken,
  removeProfilePicture,
  shareProfile,
  signup,
  updatePassword,
  updateProfile,
  uploadCoverPics,
  uploadPic,
  userProfile,
} from './user.service.js';
import { authentication } from '../../middlewares/auth/user.auth.js';
import { Validation } from '../../middlewares/validation/validation.js';
import {
  confirmEmailValidation,
  coverPicsValidation,
  getVisitCountValidation,
  googleSigninValidation,
  loginValidation,
  refreshTokenValidation,
  shareProfileValidation,
  signupValidation,
  updatePasswordValidation,
  updateProfileValidation,
  uploadProfilePicValidation,
} from './user.validations.js';
import {
  fileUploader,
  fileUploader_cloudinary,
} from '../../middlewares/upload/multer.js';
import { authorization } from '../../middlewares/auth/user.author.js';

const router = Router();
router.post(
  '/signup',

  Validation(signupValidation),
  async (req, res, next) => {
    console.log('signup being called....');
    const user = await signup(req);
    return successResponse(res, {
      message: 'otp sent to your mail ,please check your inbox',
      statusCode: 201,
      data: user,
    });
  },
);
router.patch(
  '/confirm-email',
  Validation(confirmEmailValidation),
  async (req, res, next) => {
    console.log('confirm-email being called....');
    await confirmAccount(req.body);
    return successResponse(res, {
      message: 'email has been confirmed',
      statusCode: 201,
    });
  },
);
router.post('/signin', Validation(loginValidation), async (req, res, next) => {
  console.log('sign being called....');
  const tokens = await login(req.body);
  return successResponse(res, {
    message: 'user logged in',
    statusCode: 201,
    data: { ...tokens },
  });
});
router.get('/profile', authentication, async (req, res, next) => {
  console.log('profile being called....');
  const profile = await userProfile(req.user);
  return successResponse(res, {
    message: 'user logged in',
    statusCode: 201,
    data: { user: profile },
  });
});
router.post(
  '/signup/gmail',
  Validation(googleSigninValidation),
  async (req, res, next) => {
    console.log('signup with google being called....');
    const { token, created } = await GmailSignUp(req.body);

    return successResponse(res, {
      message: !created ? 'login successfully' : 'user created',
      statusCode: !created ? 200 : 201,
      data: { token },
    });
  },
);
router.post(
  '/upload/profile-pic',
  authentication,
  fileUploader_cloudinary().single('profile'),
  Validation(uploadProfilePicValidation),
  async (req, res, next) => {
    console.log('profile being called....');
    const file = await uploadPic(req);
    return successResponse(res, {
      message: 'file uploaded successfully',
      statusCode: 200,
    });
  },
);
router.post('/refresh-token', authentication, async (req, res, next) => {
  const token = await refreshToken(req);
  return successResponse(res, {
    message: 'token refreshed successfully',
    statusCode: 200,
    data: { accessToken: token },
  });
});
router.get(
  '/share-profile/:id',
  Validation(shareProfileValidation),
  async (req, res, next) => {
    const user = await shareProfile(req.params.id);
    return successResponse(res, {
      message: 'done',
      statusCode: 200,
      data: { user },
    });
  },
);
router.patch(
  '/update-profile/',
  Validation(updateProfileValidation),
  authentication,
  async (req, res, next) => {
    const user = await updateProfile(req);
    return successResponse(res, {
      message: 'user updated successfully',
      statusCode: 200,
    });
  },
);
router.patch(
  '/update-password/',
  authentication,
  Validation(updatePasswordValidation),

  async (req, res, next) => {
    const user = await updatePassword(req);
    return successResponse(res, {
      message: 'password updated successfully',
      statusCode: 200,
      data: { user },
    });
  },
);
router.delete('/logout', authentication, async (req, res, next) => {
  await logout(req);
  return successResponse(res, {
    message: 'logged out successfully',
    statusCode: 200,
  });
});
router.delete('/remove-profilePic', authentication, async (req, res, next) => {
  await removeProfilePicture(req.user);
  return successResponse(res, {
    message: 'picture removed',
    statusCode: 200,
  });
});
router.get(
  '/visit-count/:id',
  authentication,
  authorization(['admin']),
  Validation(getVisitCountValidation),
  async (req, res, next) => {
    const visitCount = await getViewCount(req.params.id);
    return successResponse(res, {
      message: 'done',
      statusCode: 200,
      data: { visitCount },
    });
  },
);
router.patch(
  '/cover-pics',
  fileUploader_cloudinary().array('cover', 2),
  Validation(coverPicsValidation),
  authentication,
  async (req, res, next) => {
    await uploadCoverPics(req);
    return successResponse(res, {
      message: 'done',
      statusCode: 200,
    });
  },
);
export default router;
