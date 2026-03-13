import express from 'express';
import { userRouter } from './modules/user/index.js';
import { GlobalErrorHandler, KnownErrorHandler } from './middlewares/index.js';
import { env } from './config/index.js';
import connectDb from './DB/mongoose.connection.js';
import { asymmetric } from './utils/index.js';
import { resolve } from 'path';
import cors from 'cors';
import { redis_connection } from './DB/index.js';

const bootstrap = async () => {
  const app = express();

  const { PORT } = env;
  await connectDb();
  await redis_connection();
  asymmetric.runForFirstTime();
  app.use(cors());

  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  app.use(express.json());

  app.use('/users', userRouter);
  app.use(KnownErrorHandler, GlobalErrorHandler);
  app.use('/uploads', express.static(resolve('uploads')));
  app.use('{/dummy}', (req, res, next) => {
    res.status(404).json({ message: `this ${req.originalUrl} is not exist` });
  });
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
};
export default bootstrap;
