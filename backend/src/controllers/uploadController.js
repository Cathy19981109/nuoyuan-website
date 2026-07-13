const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { success, fail } = require('../utils/response');

const uploadRoot = path.join(process.cwd(), 'uploads');
const imageDir = path.join(uploadRoot, 'images');
const videoDir = path.join(uploadRoot, 'videos');

[uploadRoot, imageDir, videoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function getSafeExt(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  return ext || '';
}

function buildFilename(prefix, originalname) {
  const ext = getSafeExt(originalname);
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, imageDir),
    filename: (req, file, cb) => cb(null, buildFilename('img', file.originalname)),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('仅支持 png/jpg/webp 图片'));
      return;
    }
    cb(null, true);
  },
});

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, videoDir),
    filename: (req, file, cb) => cb(null, buildFilename('video', file.originalname)),
  }),
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'video/mp4') {
      cb(new Error('仅支持 mp4 视频'));
      return;
    }
    cb(null, true);
  },
});

function image(req, res, next) {
  imageUpload.single('file')(req, res, (err) => {
    if (err) return fail(res, err.message, 400, 400);
    if (!req.file) return fail(res, '请上传图片文件', 400, 400);
    const fileUrl = `/uploads/images/${req.file.filename}`;
    return success(res, { url: fileUrl, name: req.file.originalname }, '上传成功');
  });
}

function video(req, res, next) {
  videoUpload.single('file')(req, res, (err) => {
    if (err) return fail(res, err.message, 400, 400);
    if (!req.file) return fail(res, '请上传视频文件', 400, 400);
    const fileUrl = `/uploads/videos/${req.file.filename}`;
    return success(res, { url: fileUrl, name: req.file.originalname }, '上传成功');
  });
}

module.exports = { image, video };
