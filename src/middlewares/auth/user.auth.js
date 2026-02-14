import { env } from '../../config/index.js';
import { dbService, USER } from '../../DB/index.js';
import { asymmetric, failResponse } from '../../utils/index.js';
import jwt from 'jsonwebtoken';

export const authentication = async (req, res, next) => {
  const auth = req.headers.authentication;
  if (!auth) {
    return failResponse(res, {
      message: 'Missing authentication header',
      statusCode: 401,
    });
  }
  const [prefix, token] = auth.split(' ');
  if (!prefix || prefix !== 'Bearer') {
    return failResponse(res, {
      message: 'invalid prefix',
      statusCode: 401,
    });
  }
  if (!token) {
    return failResponse(res, {
      message: 'Missing token',
      statusCode: 401,
    });
  }
  const { JWT_SECRET } = env;
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await dbService.findDocById(USER, {
    id: decoded.id,
    select: ['-password', '-__v', '-createdAt', '-updatedAt'],
  });

  if (!user) {
    return failResponse(res, {
      message: "User doesn't does not exist",
      statusCode: 401,
    });
  }
  if (!user.isConfirmed) {
    return failResponse(res, {
      message: 'this email is not confirmed yet',
      statusCode: 401,
    });
  }
  user.phone = await asymmetric.Decryption(user.phone);
  req.user = user;
  next();
};
