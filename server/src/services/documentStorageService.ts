import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { Request } from 'express';

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage configuration with random hex filenames to prevent path traversal
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    cb(null, randomName);
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format '${file.mimetype}'. Only PDF, JPEG, and PNG documents are accepted.`));
  }
};

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabytes max limit
    files: 1,
  },
  fileFilter,
});

/**
 * Computes SHA-256 hash of a file on disk
 */
export const computeFileHash = async (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

/**
 * Resolves safe absolute path for storage key, preventing directory traversal
 */
export const getStorageFilePath = (storageKey: string): string | null => {
  // Prevent any path traversal attacks
  const safeFilename = path.basename(storageKey);
  const targetPath = path.join(UPLOADS_DIR, safeFilename);

  if (!fs.existsSync(targetPath)) {
    return null;
  }

  return targetPath;
};
