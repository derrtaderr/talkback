const multer = require('multer');
const path = require('path');

// Configure multer for voice memo uploads
const storage = multer.memoryStorage(); // Store file in memory for S3 upload

const fileFilter = (req, file, cb) => {
  // Accept audio files only
  const allowedMimeTypes = [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/webm',
    'audio/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

module.exports = upload; 