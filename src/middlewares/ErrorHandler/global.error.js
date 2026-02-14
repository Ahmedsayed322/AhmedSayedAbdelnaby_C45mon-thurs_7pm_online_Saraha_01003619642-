import { env } from '../../config/index.js';

const GlobalErrorHandler = (err, req, res, next) => {
  const message = err.message;
  const statusCode = err.statusCode ?? 500;
  const isApiError = !!err.isApiError;
  const finalResponse = {
    success: false,
    message:
      !isApiError && env.NODE_ENV === 'production'
        ? 'something went wrong'
        : message,
  };
  if (env.NODE_ENV === 'development' && !isApiError) {
    finalResponse.stack = err.stack;
    // if(statusCode>=500){
    //   console.log(err)
    // }
  }
  return res.status(statusCode).json(finalResponse);
};
export default GlobalErrorHandler;
