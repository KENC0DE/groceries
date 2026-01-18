// Image Upload and Compression Utility

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const MAX_WIDTH = 600; // Max width in pixels
const MAX_HEIGHT = 600; // Max height in pixels
const QUALITY = 0.6; // JPEG quality (0.6 = 60%)

/**
 * Compress and resize an image file
 * @param {File} file - The image file to compress
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        // Create canvas and compress
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob (JPEG format for better compression)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          QUALITY,
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Upload image to ImgBB
 * @param {Blob} imageBlob - Compressed image blob
 * @returns {Promise<string>} - URL of uploaded image
 */
export const uploadToImgBB = async (imageBlob) => {
  try {
    if (!IMGBB_API_KEY || IMGBB_API_KEY === "your_imgbb_api_key_here") {
      throw new Error(
        "ImgBB API key not configured. Please check your .env file.",
      );
    }

    // Convert blob to base64
    const base64 = await blobToBase64(imageBlob);
    const base64Data = base64.split(",")[1]; // Remove data:image/jpeg;base64, prefix

    const formData = new FormData();
    formData.append("image", base64Data);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();
    return data.data.url; // Returns the direct image URL
  } catch (error) {
    console.error("ImgBB upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Convert blob to base64
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Main function: Compress and upload image
 * @param {File} file - Image file from input
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<string>} - URL of uploaded image
 */
export const uploadImage = async (file, onProgress) => {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image file");
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image is too large (max 10MB)");
    }

    if (onProgress) onProgress("Compressing image...");

    // Compress the image
    const compressedBlob = await compressImage(file);

    // Calculate compression ratio
    const originalSize = (file.size / 1024).toFixed(0);
    const compressedSize = (compressedBlob.size / 1024).toFixed(0);
    console.log(`Image compressed: ${originalSize}KB → ${compressedSize}KB`);

    if (onProgress) onProgress("Uploading to ImgBB...");

    // Upload to ImgBB
    const imageUrl = await uploadToImgBB(compressedBlob);

    if (onProgress) onProgress("Upload complete!");

    return imageUrl;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};
