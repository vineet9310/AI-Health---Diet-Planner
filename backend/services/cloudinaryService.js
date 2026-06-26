const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Uploads a file to Cloudinary.
 * @param {string} filePath - Absolute path to the file.
 * @returns {Promise<string|null>} - The secure url of the uploaded file, or null if Cloudinary is not configured.
 */
const uploadToCloudinary = async (filePath) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('Cloudinary credentials not configured, skipping cloud upload.');
      return null;
    }

    console.log(`Uploading file ${filePath} to Cloudinary...`);
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'vitalplan_reports'
    });

    console.log(`Cloudinary upload successful! URL: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

/**
 * Deletes a file from Cloudinary.
 * @param {string} fileUrl - The secure URL of the file.
 */
const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes('cloudinary.com')) return;
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return;

    // Extract public ID from the URL
    // URL format: https://res.cloudinary.com/[cloud_name]/[resource_type]/upload/v[version]/[folder]/[public_id].[ext]
    const parts = fileUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return;

    // public_id is after the version part (e.g. v12345678)
    const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));

    console.log(`Deleting file from Cloudinary with public ID: ${publicId}...`);
    // Need to specify the resource type if it's raw (like PDF)
    const resourceType = fileUrl.includes('/raw/') ? 'raw' : 'image';
    await cloudinary.uploader.destroy(publicId, { resourceType });
    console.log('Cloudinary file deleted successfully.');
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
