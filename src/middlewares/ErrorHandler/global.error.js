import { resolve } from "path";
import { env } from "../../config/index.js";
import { unlink } from "fs";

const GlobalErrorHandler = async (err, req, res, next) => {
  if (req.file) {
    await unlink(resolve(req.file.destination + "/" + req.file.filename));
  }
  const message = err.message;
  const statusCode = err.statusCode ?? 500;
  const isApiError = !!err.isApiError;
  const finalResponse = {
    success: false,
    message:
      !isApiError && env.NODE_ENV === "production"
        ? "something went wrong"
        : message,
  };
  if (env.NODE_ENV === "development" && !isApiError) {
    finalResponse.stack = err.stack;
    // if(statusCode>=500){
    //   console.log(err)
    // }
  }
  return res.status(statusCode).json(finalResponse);
};
export default GlobalErrorHandler;
