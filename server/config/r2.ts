import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'authentik-avatars'
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${R2_BUCKET_NAME}.r2.cloudflarestorage.com`

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID) {
  console.warn('Cloudflare R2 credentials not configured. Avatar uploads will be disabled.')
}

// Create S3 client configured for Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || ''
  }
})

export const R2_CONFIG = {
  bucketName: R2_BUCKET_NAME,
  publicUrl: R2_PUBLIC_URL,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  isConfigured: !!(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ACCOUNT_ID)
}

export async function uploadToR2(key: string, body: Buffer, contentType: string) {
  if (!R2_CONFIG.isConfigured) {
    throw new Error('Cloudflare R2 is not configured')
  }

  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000' // Cache for 1 year
  })

  await r2Client.send(command)
  return `${R2_CONFIG.publicUrl}/${key}`
}

export async function deleteFromR2(key: string) {
  if (!R2_CONFIG.isConfigured) {
    throw new Error('Cloudflare R2 is not configured')
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key
  })

  await r2Client.send(command)
}

export async function generatePresignedUrl(key: string, expiresIn = 3600) {
  if (!R2_CONFIG.isConfigured) {
    throw new Error('Cloudflare R2 is not configured')
  }

  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key
  })

  return getSignedUrl(r2Client, command, { expiresIn })
}