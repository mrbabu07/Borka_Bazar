/**
 * Upload image to imgBB and return permanent URL
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<string>} - The permanent imgBB URL
 */
const uploadToImgBB = async (imageFile) => {
  try {
    // Validate file
    if (!imageFile) {
      throw new Error("No image file provided");
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    // Get API key from environment
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error("imgBB API key not configured. Please add VITE_IMGBB_API_KEY to .env.local");
    }

    // Create FormData
    const formData = new FormData();
    formData.append("image", imageFile);

    // Upload to imgBB
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || "imgBB upload failed");
    }

    // Return permanent image URL
    return data.data.url;
  } catch (error) {
    console.error("imgBB upload error:", error);
    throw error;
  }
};

/**
 * Upload multiple images to imgBB
 * @param {File[]} imageFiles - Array of image files to upload
 * @param {Function} onProgress - Callback for progress updates (current, total)
 * @returns {Promise<string[]>} - Array of permanent imgBB URLs
 */
export const uploadMultipleToImgBB = async (imageFiles, onProgress) => {
  const urls = [];
  const total = imageFiles.length;

  for (let i = 0; i < imageFiles.length; i++) {
    try {
      const url = await uploadToImgBB(imageFiles[i]);
      urls.push(url);
      
      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      console.error(`Failed to upload image ${i + 1}:`, error);
      throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
    }
  }

  return urls;
};

export default uploadToImgBB;
