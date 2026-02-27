import express from "express";
import { userRouter } from "./modules/user/index.js";
import { GlobalErrorHandler, KnownErrorHandler } from "./middlewares/index.js";
import { env } from "./config/index.js";
import connectDb from "./DB/mongoose.connection.js";
import { asymmetric } from "./utils/index.js";
import { resolve } from "path";
import cors from "cors";
const bootstrap = async () => {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  const { PORT } = env;
  await connectDb();
  asymmetric.runForFirstTime();
  app.use(cors());

  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
  });

  app.use(express.json());

  app.use("/users", userRouter);
  app.use(KnownErrorHandler, GlobalErrorHandler);
  app.use("/uploads/profilePics", express.static(resolve("uploads/profilePics")));
  app.use("{/dummy}", (req, res, next) => {
    res.status(404).json({ message: `this ${req.originalUrl} is not exist` });
  });
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
};
export default bootstrap;
