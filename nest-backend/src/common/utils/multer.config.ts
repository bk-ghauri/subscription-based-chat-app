import { diskStorage } from 'multer';
import { extname } from 'path';

export const createMulterConfig = (
  destination: string,
  allowedTypes: string[],
  maxSizeMB: number,
) => ({
  storage: diskStorage({
    destination,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type'), false);
    }
    cb(null, true);
  },
});
