import multer from 'multer'
import { Request } from 'express'
import { R2_CONFIG } from '../config/r2'

// Configure multer for memory storage
const storage = multer.memoryStorage()

// File filter to validate uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!R2_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'))
    return
  }
  
  cb(null, true)
}

// Create multer upload middleware
export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: R2_CONFIG.maxFileSize // 5MB limit
  }
}).single('file')

// Error handler for multer
export const handleUploadError = (error: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return 'File size too large. Maximum size is 5MB.'
    }
    return error.message
  } else if (error) {
    return error.message || 'Upload failed'
  }
  return 'Unknown upload error'
}