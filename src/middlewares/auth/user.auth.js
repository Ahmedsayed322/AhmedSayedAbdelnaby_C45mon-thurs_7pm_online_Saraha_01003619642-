import { env } from '../../config/index.js';
import { dbService, USER } from '../../DB/index.js';
import { getValue, revokedKey } from '../../DB/redis/redis.service.js';
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
  console.log(prefix !== 'Refresh');

  if (!prefix || (prefix !== 'Bearer' && prefix !== 'Refresh')) {
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
  const { JWT_SECRET, REFRESH_TOKEN_SECRET } = env;
  const decoded = jwt.verify(
    token,
    prefix === 'Bearer' ? JWT_SECRET : REFRESH_TOKEN_SECRET,
  );
  const user = await dbService.findDocById(USER, {
    id: decoded.id,
    select: ['-__v', '-createdAt', '-updatedAt'],
  });

  if (!user) {
    return failResponse(res, {
      message: "User doesn't does not exist",
      statusCode: 401,
    });
  }

  if (user.phone) {
    user.phone = await asymmetric.Decryption(user.phone);
  }
  if (
    user?.changeCredentials &&
    user.changeCredentials.getTime() > decoded.iat * 1000
  ) {
    return failResponse(res, {
      message: 'token is invalid',
      statusCode: 401,
    });
  }
  const check = await getValue(
    revokedKey({ userId: user._id, jti: decoded.jti }),
  );
  if (check) {
    return failResponse(res, {
      message: 'token is invalid',
      statusCode: 401,
    });
  }

  req.decoded = decoded;
  req.user = user;
  next();
};
