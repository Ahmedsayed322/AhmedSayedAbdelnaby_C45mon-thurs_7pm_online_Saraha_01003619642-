import { ApiError } from '../../utils/index.js';

export const authorization =  (roles = []) => {
  return  async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError('unauthorized', 401);
    }
    next();
  };
};
