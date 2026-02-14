import { Error as mongooseError } from 'mongoose';
import { failResponse } from '../../utils/index.js';

const KnownErrorHandler = (err, req, res, next) => {  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => {
      return {
        field: e.path,
        message: e.message,
      };
    });
    return failResponse(res, {
      message: 'Validation error',
      statusCode: 400,
      errors,
    });
  } else if (err instanceof mongooseError.CastError) {
    return failResponse(res, {
      message: `Invalid ${err.path}`,
      statusCode: 400,
    });
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return failResponse(res, {
      message: `${field} already exists`,
      statusCode: 409,
    });
  }

  next(err);
};

export default KnownErrorHandler;
