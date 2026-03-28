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

  // Track product view
  useProductView(product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    const imageToUse =
      product.image || (product.images && product.images[0]) || fallbackImage;
    addToCart(product, 1, imageToUse);
    setTimeout(() => setIsAdding(false), 1500);
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop";

  const displayImage =
    product.image || (product.images && product.images[0]) || fallbackImage;

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
      <div className="relative bg-white overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
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
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
            <img
              src={displayImage}
              alt={product.title}
              className={`w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              } ${isHovered ? "scale-105" : "scale-100"}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
              <span className="text-sm tracking-widest uppercase font-medium text-gray-500">
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
                      : "bg-white text-black hover:bg-gold-500 hover:text-white"
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
        <div className="p-6 text-center space-y-2">
          {/* Title */}
          <h3 className="font-display text-base md:text-lg text-black group-hover:text-gold-600 transition-colors leading-tight min-h-[3rem] line-clamp-2">
            {product.title}
          </h3>

          {/* Fabric/Style Info */}
          {(product.fabric || product.style) && (
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              {product.fabric || product.style}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="text-lg md:text-xl font-semibold text-black">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Stock Status - Minimal */}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-gold-600 tracking-wide">
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
        <div className="relative bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setQuickViewOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-white hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div className="aspect-[3/4] overflow-hidden bg-gray-50">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl md:text-3xl text-black mb-2">
                  {product.title}
                </h2>
                <p className="text-2xl font-semibold text-black">
                  {formatPrice(product.price)}
                </p>
              </div>

              {product.description && (
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-black mb-3 uppercase tracking-wide">
                    Select Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border text-sm transition-all ${
                          selectedSize === size
                            ? "border-black bg-black text-white"
                            : "border-gray-300 hover:border-black"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-black mb-3 uppercase tracking-wide">
                    Select Color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border text-sm transition-all ${
                          selectedColor === color
                            ? "border-black bg-black text-white"
                            : "border-gray-300 hover:border-black"
                        }`}
                      >
                        {color}
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
                    handleAddToCart(e);
                    setQuickViewOpen(false);
                  }}
                  disabled={isAdding || product.stock === 0}
                  className="w-full py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {product.stock === 0 ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}
                </button>
                <Link
                  to={`/product/${product._id}`}
                  onClick={() => setQuickViewOpen(false)}
                  className="block w-full py-4 border-2 border-black text-black text-center text-sm tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-colors"
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
