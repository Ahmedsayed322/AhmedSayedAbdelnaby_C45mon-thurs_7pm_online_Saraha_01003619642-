import { Router } from 'express';
import { successResponse } from '../../utils/index.js';
import { confirmAccount, GmailSignUp, login, signup } from './user.service.js';
import { authentication } from '../../middlewares/auth/user.auth.js';

const router = Router();
router.post('/signup', async (req, res, next) => {
  console.log(req.body);

  console.log('signup being called....');
  const user = await signup(req.body);
  return successResponse(res, {
    message: 'otp sent to your mail ,please check your inbox',
    statusCode: 201,
    data: user,
  });
});
router.patch('/confirm-email', async (req, res, next) => {
  console.log('confirm-email being called....');
  await confirmAccount(req.body);
  return successResponse(res, {
    message: 'email has been confirmed',
    statusCode: 201,
  });
});
router.post('/signin', async (req, res, next) => {
  console.log('sign being called....');
  const token = await login(req.body);

  return successResponse(res, {
    message: 'user logged in',
    statusCode: 201,
    data: { token },
  });
});
router.get('/profile', authentication, async (req, res, next) => {
  console.log('profile being called....');

  return successResponse(res, {
    message: 'user logged in',
    statusCode: 201,
    data: { user: req.user },
  });
});
router.post('/signup/gmail', async (req, res, next) => {
  console.log('signup with google being called....');
  const { token, created } = await GmailSignUp(req.body);

  return successResponse(res, {
    message: !created ? 'login successfully' : 'user created',
    statusCode: !created ? 200 : 201,
    data: { token },
  });
});
export default router;
