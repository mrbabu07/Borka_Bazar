import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById, getProducts } from "../services/api";
import useCart from "../hooks/useCart";
import useWishlist from "../hooks/useWishlist";
import ProductCardPremium from "../components/ProductCardPremium";
import { toast } from "react-hot-toast";

export default function ProductDetailPremium() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await getProductById(id);
      const productData = response.data.data;
      setProduct(productData);

      // Set default selections
      if (productData.sizes?.length > 0) {
        setSelectedSize(productData.sizes[0]);
      }
      if (productData.colors?.length > 0) {
        setSelectedColor(productData.colors[0]);
      }

      // Fetch related products
      const allProducts = await getProducts();
      const related = allProducts.data.data
        .filter(p => p._id !== id && p.category?._id === productData.category?._id)
        .slice(0, 4);
      setRelatedProducts(related);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    addToCart(product, quantity, selectedSize, selectedColor);
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    addToCart(product, quantity, selectedSize, selectedColor);
    navigate("/cart");
  };

  const toggleWishlist = () => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product not found</p>
          <Link to="/products" className="text-gold-600 hover:text-gold-700">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.image];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-black transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-black">{product.title}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="aspect-[3/4] mb-6 overflow-hidden bg-gray-50">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-[3/4] overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-black"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-8">
            {/* Title & Price */}
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-black mb-4">
                {product.title}
              </h1>
              <p className="text-3xl font-semibold text-black">
                ৳{product.price?.toLocaleString()}
              </p>
            </div>

            {/* Product Details */}
            <div className="space-y-3 text-sm border-t border-b border-gray-100 py-6">
              {product.fabric && (
                <div className="flex">
                  <span className="font-medium text-black w-24 uppercase tracking-wide">Fabric:</span>
                  <span className="text-gray-700">{product.fabric}</span>
                </div>
              )}
              {product.style && (
                <div className="flex">
                  <span className="font-medium text-black w-24 uppercase tracking-wide">Style:</span>
                  <span className="text-gray-700">{product.style}</span>
                </div>
              )}
              {product.category && (
                <div className="flex">
                  <span className="font-medium text-black w-24 uppercase tracking-wide">Category:</span>
                  <span className="text-gray-700">{product.category.name}</span>
                </div>
              )}
              {product.stock !== undefined && (
                <div className="flex">
                  <span className="font-medium text-black w-24 uppercase tracking-wide">Stock:</span>
                  <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
                    {product.stock > 0 ? `${product.stock} Available` : "Out of Stock"}
                  </span>
                </div>
              )}
            </div>

            {/* Size Selector */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300 text-gray-700 hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                  Select Color
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-6 py-3 border text-sm font-medium transition-all ${
                        selectedColor === color
                          ? "border-black bg-black text-white"
                          : "border-gray-300 text-gray-700 hover:border-black"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <p className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                Quantity
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 border border-gray-300 hover:border-black transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 border border-gray-300 hover:border-black transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full py-4 border-2 border-black text-black text-sm tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-colors disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
              <button
                onClick={toggleWishlist}
                className="w-full py-4 border border-gray-300 text-gray-700 text-sm tracking-widest uppercase font-medium hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className={`w-5 h-5 ${isInWishlist(product._id) ? "fill-current" : ""}`}
                  fill={isInWishlist(product._id) ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-gray-100 pt-16">
            <h2 className="font-display text-2xl md:text-3xl text-black text-center mb-12">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {relatedProducts.map((product) => (
                <ProductCardPremium key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
