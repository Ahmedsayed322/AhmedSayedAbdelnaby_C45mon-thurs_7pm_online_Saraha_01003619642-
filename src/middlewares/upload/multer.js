import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname } from "path";
import { ApiError } from "../../utils/index.js";
export const fileUploader = ({ folderName = "General" }) => {
  mkdirSync(`uploads/${folderName}`, { recursive: true });
  //   await fs.mkdir(`uploads/${folderName}`, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `uploads/${folderName}`);
    },
    filename: (req, file, cb) => {
      const fileName =
        crypto.randomUUID() + "_" + Date.now() + extname(file.originalname);
      cb(null, fileName);
    },
  });
  const fileFilter = (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new ApiError("File type not allowed", 400), false);
    }
    cb(null, true);
  };
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 1024 * 1024 * 20,
    },
  });
  return upload;
};
