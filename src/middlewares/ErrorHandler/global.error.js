import { resolve } from 'path';
import { env } from '../../config/index.js';
import { unlink } from 'fs/promises';
import cloudinary from '../../utils/cloudinary/cloudinary.js';

const GlobalErrorHandler = async (err, req, res, next) => {
  // if (req.file) {
  //   try {
  //     await unlink(resolve(req.file.path));
  //   } catch (e) {
  //     console.log('cloud ');
  //   }
  // }
  if (req.file?.profilePicId) {
    await cloudinary.uploader.destroy(req.file.profilePicId);
  }

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
