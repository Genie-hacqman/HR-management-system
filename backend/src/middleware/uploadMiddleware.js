const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Files land in backend/uploads/documents/ — a directory that is NEVER
 * mounted with express.static and has no public route. The only way to
 * read a file back out is GET /api/documents/:id/download, which
 * re-authenticates and re-authorizes on every request (see
 * documentController.downloadDocument). This is what satisfies the
 * spec's "Use secure file access. Do not expose private document
 * storage URLs publicly."
 */
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(24).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('Unsupported file type. Allowed: PDF, JPEG, PNG, DOC, DOCX.'));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { upload, UPLOAD_DIR };
