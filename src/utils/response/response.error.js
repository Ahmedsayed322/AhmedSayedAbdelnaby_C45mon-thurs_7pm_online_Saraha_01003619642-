const failResponse = (
  res,
  { message = 'error occurred', statusCode = 400, errors = undefined },
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
export default failResponse;
