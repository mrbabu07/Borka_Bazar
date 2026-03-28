import { useState } from "react";
import { X, Upload, Loader } from "lucide-react";
import uploadToImgBB, { uploadMultipleToImgBB } from "../../utils/uploadToImgBB";

/**
 * ImageUploader - Component for uploading images to imgBB
 * @param {string[]} images - Array of current image URLs
 * @param {Function} onChange - Callback when images change
 * @param {number} maxImages - Maximum number of images allowed (default: 5)
 */
const ImageUploader = ({ images = [], onChange, maxImages = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [previews, setPreviews] = useState(images);
  const [error, setError] = useState("");

  // Handle file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Check max images limit
    if (previews.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      // Upload all files to imgBB
      const urls = await uploadMultipleToImgBB(files, (current, total) => {
        setUploadProgress({ current, total });
      });

      // Add new URLs to existing images
      const newImages = [...previews, ...urls];
      setPreviews(newImages);
      onChange(newImages);
    } catch (err) {
      setError(err.message || "Failed to upload images");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  // Remove image
  const handleRemoveImage = (index) => {
    const newImages = previews.filter((_, i) => i !== index);
    setPreviews(newImages);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Product Images
          <span className="text-gray-500 ml-2 text-xs">
            (Max {maxImages} images, up to 5MB each)
          </span>
        </label>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {previews.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {previews.length < maxImages && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className={`cursor-pointer flex flex-col items-center ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader className="animate-spin text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">
                  Uploading {uploadProgress.current} of {uploadProgress.total}...
                </p>
              </>
            ) : (
              <>
                <Upload className="text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG, GIF, WebP (max 5MB)
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Info Message */}
      {previews.length === 0 && !error && (
        <p className="text-sm text-gray-500">
          Upload at least one image. The first image will be the main product image.
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
