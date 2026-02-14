const successResponse = (
  res,
  { message = 'done', statusCode = 200, data = undefined },
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};
export default successResponse;
