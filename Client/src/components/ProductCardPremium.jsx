import { useState } from "react";
import { Link } from "react-router-dom";
import useCart from "../hooks/useCart";
import useProductView from "../hooks/useProductView";
import WishlistButton from "./WishlistButton";
import { useCurrency } from "../hooks/useCurrency";

export default function ProductCardPremium({ product }) {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [isAdding, setIsAdding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");

  const getColorLabel = (color) => {
    if (!color) return "";
    if (typeof color === "string") return color;
    return color.name || color.value || JSON.stringify(color);
  };

  const getColorKey = (color, index) =>
    `${getColorLabel(color) || "color"}-${index}`;

  const isSameColor = (left, right) =>
    getColorLabel(left) === getColorLabel(right);

  // Track product view
  useProductView(product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if product has sizes and if size is required
    const hasSizes = product.sizes?.length > 0 || product.availableSizes?.length > 0;
    
    // If product has sizes but none selected, open quick view instead
    if (hasSizes && !selectedSize) {
      setQuickViewOpen(true);
      return;
    }
    
    setIsAdding(true);
    const imageToUse =
      product.image || (product.images && product.images[0]) || fallbackImage;
    
    // Pass size and color to cart
    addToCart(product, 1, imageToUse, selectedSize || null, selectedColor || null);
    
    setTimeout(() => setIsAdding(false), 1500);
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop";

  const displayImage =
    product.image || (product.images && product.images[0]) || fallbackImage;
  const displayTitle = product.title || product.name || "Product";

  const isOutOfStock = product.stock === 0;

  // Calculate discount percentage
  const discountPercentage =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  return (
    <>
    <Link 
      to={`/product/${product._id}`} 
      className="block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden bg-white text-gray-950 transition-colors dark:bg-gray-900 dark:text-gray-100">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-800">
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-4 left-4 z-20">
              <span className="bg-black text-white text-xs font-medium px-3 py-1 tracking-wider">
                -{discountPercentage}%
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <div 
            className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={(e) => e.preventDefault()}
          >
            <WishlistButton product={product} size="sm" />
          </div>

          {/* Image with loading state */}
          <div className="relative w-full h-full">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse dark:bg-gray-800" />
            )}
            <img
              src={displayImage}
              alt={displayTitle}
              className={`w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              } ${isHovered ? "scale-105" : "scale-100"}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-950/85">
              <span className="text-sm font-medium uppercase tracking-widest text-gray-500 dark:text-gray-300">
                Out of Stock
              </span>
            </div>
          )}

          {/* Hover Overlay with Actions */}
          {!isOutOfStock && (
            <div className={`absolute inset-0 bg-black/0 transition-all duration-300 ${
              isHovered ? "bg-black/10" : ""
            }`}>
              <div className={`absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3 transition-all duration-300 ${
                isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`w-full py-3 text-sm tracking-widest uppercase font-medium transition-all ${
                    isAdding
                      ? "bg-gold-500 text-white"
                      : "bg-white text-black hover:bg-gold-500 hover:text-white dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gold-500 dark:hover:text-white"
                  }`}
                >
                  {isAdding ? "Added!" : "Add to Cart"}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setQuickViewOpen(true);
                  }}
                  className="w-full py-3 bg-black/80 backdrop-blur-sm text-white text-sm tracking-widest uppercase font-medium hover:bg-black transition-all"
                >
                  Quick View
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2 p-6 text-center">
          {/* Title */}
          <h3 className="font-display min-h-[3rem] text-base leading-tight text-black transition-colors line-clamp-2 group-hover:text-gold-600 dark:text-white dark:group-hover:text-gold-400 md:text-lg">
            {displayTitle}
          </h3>

          {product.sku && (
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              SKU {product.sku}
            </p>
          )}

          {/* Fabric/Style Info */}
          {(product.fabric || product.style) && (
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {product.fabric || product.style}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="text-lg font-semibold text-black dark:text-white md:text-xl">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through dark:text-gray-500">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Stock Status - Minimal */}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs tracking-wide text-gold-600 dark:text-gold-400">
              Only {product.stock} left
            </p>
          )}
        </div>
      </div>
    </Link>

    {/* Quick View Modal */}
    {quickViewOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setQuickViewOpen(false)}
        />
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white text-gray-950 shadow-2xl dark:bg-gray-900 dark:text-gray-100">
          <button
            onClick={() => setQuickViewOpen(false)}
            className="absolute right-4 top-4 z-10 bg-white p-2 text-gray-900 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div className="aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-800">
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h2 className="font-display mb-2 text-2xl text-black dark:text-white md:text-3xl">
                  {displayTitle}
                </h2>
                {product.sku && (
                  <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    SKU {product.sku}
                  </p>
                )}
                <p className="text-2xl font-semibold text-black dark:text-white">
                  {formatPrice(product.price)}
                </p>
              </div>

              {product.description && (
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                  {product.description}
                </p>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium uppercase tracking-wide text-black dark:text-white">
                    Select Size <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border text-sm transition-all ${
                          selectedSize === size
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-gray-950"
                            : "border-gray-300 text-gray-700 hover:border-black dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {!selectedSize && (
                    <p className="text-xs text-red-500 mt-2">
                      Please select a size
                    </p>
                  )}
                </div>
              )}

              {/* Available Sizes (with stock info) */}
              {product.availableSizes && product.availableSizes.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium uppercase tracking-wide text-black dark:text-white">
                    Select Size <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.availableSizes.map((sizeItem) => (
                      <button
                        key={sizeItem.size}
                        onClick={() => setSelectedSize(sizeItem.size)}
                        disabled={sizeItem.stock === 0}
                        className={`px-4 py-2 border text-sm transition-all relative ${
                          selectedSize === sizeItem.size
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-gray-950"
                            : sizeItem.stock === 0
                            ? "border-gray-200 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:text-gray-600"
                            : "border-gray-300 text-gray-700 hover:border-black dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-300"
                        }`}
                      >
                        {sizeItem.size}
                        {sizeItem.stock === 0 && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-full h-px bg-gray-400 rotate-45" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {!selectedSize && (
                    <p className="text-xs text-red-500 mt-2">
                      Please select a size
                    </p>
                  )}
                </div>
              )}

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium uppercase tracking-wide text-black dark:text-white">
                    Select Color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, index) => (
                      <button
                        key={getColorKey(color, index)}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border text-sm transition-all ${
                          isSameColor(selectedColor, color)
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-gray-950"
                            : "border-gray-300 text-gray-700 hover:border-black dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-300"
                        }`}
                      >
                        {getColorLabel(color)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    
                    // Validate size selection
                    const hasSizes = product.sizes?.length > 0 || product.availableSizes?.length > 0;
                    if (hasSizes && !selectedSize) {
                      // Don't close modal, just show error
                      return;
                    }
                    
                    handleAddToCart(e);
                    setQuickViewOpen(false);
                  }}
                  disabled={isAdding || product.stock === 0}
                  className="w-full bg-black py-4 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-gold-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-white dark:text-gray-950 dark:hover:bg-gold-500 dark:hover:text-white dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                >
                  {product.stock === 0 ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}
                </button>
                <Link
                  to={`/product/${product._id}`}
                  onClick={() => setQuickViewOpen(false)}
                  className="block w-full border-2 border-black py-4 text-center text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-gray-950"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
