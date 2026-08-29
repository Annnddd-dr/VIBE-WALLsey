import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload an image buffer to Cloudinary.
 * Returns the secure URL and public ID for storage/deletion.
 */
export async function uploadImage(
  buffer: Buffer,
  folder = 'posterraxx/products'
): Promise<UploadResult> {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto:good',
        transformation: [{ width: 1400, height: 1867, crop: 'limit' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload failed'));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public ID.
 * No-ops silently if the image doesn't exist.
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.warn('[cloudinary] Not configured — skipping delete for', publicId);
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[cloudinary] Failed to delete', publicId, err);
  }
}
