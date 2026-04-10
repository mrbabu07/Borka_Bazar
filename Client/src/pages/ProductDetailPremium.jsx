import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById, getProducts } from "../services/api";
import useCart from "../hooks/useCart";
import useWishlist from "../hooks/useWishlist";
import { useCurrency } from "../hooks/useCurrency";
import ProductCardPremium from "../components/ProductCardPremium";
import ReviewsSection from "../components/reviews/ReviewsSection";
import ProductQA from "../components/ProductQA";
import ProductRecommendations from "../components/ProductRecommendations";
import SocialShare from "../components/SocialShare";
import SizeGuide from "../components/SizeGuide";
import { toast } from "react-hot-toast";

export default function ProductDetailPremium() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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
      if (productData.availableSizes?.length > 0) {
        setSelectedSize(productData.availableSizes[0].size);
      } else if (productData.sizes?.length > 0) {
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
    // Check if product has sizes and if one is selected
    const hasSizes = product.sizes?.length > 0 || product.availableSizes?.length > 0;
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    
    // Get the current selected image URL
    const currentImage = product.images?.[selectedImage] || product.image;
    
    addToCart(product, quantity, currentImage, selectedSize, selectedColor);
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    // Check if product has sizes and if one is selected
    const hasSizes = product.sizes?.length > 0 || product.availableSizes?.length > 0;
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    
    // Get the current selected image URL
    const currentImage = product.images?.[selectedImage] || product.image;
    
    addToCart(product, quantity, currentImage, selectedSize, selectedColor);
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
                {formatPrice(product.price)}
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

            {/* Size Selector with Size Guide */}
            {(product.sizes?.length > 0 || product.availableSizes?.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-black uppercase tracking-wide">
                    Select Size
                  </p>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {/* Handle both sizes array and availableSizes array */}
                  {product.availableSizes?.length > 0 ? (
                    product.availableSizes.map((sizeItem) => (
                      <button
                        key={sizeItem.size}
                        onClick={() => setSelectedSize(sizeItem.size)}
                        disabled={sizeItem.stock === 0}
                        className={`px-6 py-3 border text-sm font-medium transition-all relative ${
                          selectedSize === sizeItem.size
                            ? "border-black bg-black text-white"
                            : sizeItem.stock === 0
                            ? "border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                            : "border-gray-300 text-gray-700 hover:border-black"
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">{sizeItem.size}</div>
                          {sizeItem.stock <= 3 && sizeItem.stock > 0 && (
                            <div className="text-xs text-orange-500 mt-1">
                              Only {sizeItem.stock} left
                            </div>
                          )}
                          {sizeItem.stock === 0 && (
                            <div className="text-xs text-red-500 mt-1">
                              Out of Stock
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    product.sizes?.map((size) => (
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
                    ))
                  )}
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

            {/* Social Share */}
            <div className="border-t border-gray-100 pt-6">
              <SocialShare 
                url={window.location.href}
                title={product.title}
                image={product.images?.[0] || product.image}
              />
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

            {/* Product Rating Summary */}
            {product.rating && (
              <div className="border-t border-gray-100 pt-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating)
                            ? "text-gold-500"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating.toFixed(1)} ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews & Q&A Section */}
        <div className="mt-20 border-t border-gray-100 pt-16">
          <div className="mb-12">
            <h2 className="font-display text-2xl md:text-3xl text-black text-center mb-3">
              Customer Reviews & Questions
            </h2>
            <p className="text-center text-gray-500">
              See what our customers are saying
            </p>
          </div>
          
          {/* Reviews Section */}
          <div className="mb-16">
            <ReviewsSection productId={id} />
          </div>

          {/* Q&A Section */}
          <div className="border-t border-gray-100 pt-16 mb-16">
            <ProductQA productId={id} />
          </div>

          {/* Product Recommendations */}
          <div className="border-t border-gray-100 pt-16">
            <ProductRecommendations 
              currentProductId={id}
              category={product?.category}
              title="You May Also Like"
              limit={4}
            />
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

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-black">Burka Size Guide</h2>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8">
              {/* Introduction */}
              <div className="text-center">
                <p className="text-gray-600 leading-relaxed">
                  Find your perfect fit with our comprehensive size guide. All measurements are in inches.
                </p>
              </div>

              {/* Women's Burka Size Chart */}
              <div>
                <h3 className="font-semibold text-lg text-black mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Women's Burka Sizes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-black">Size</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-black">Bust (inches)</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-black">Waist (inches)</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-black">Hip (inches)</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-black">Length (inches)</th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-black">Height Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-200 px-4 py-3 font-medium">XS</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">32-34</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">24-26</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">34-36</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">54-56</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">5'0" - 5'3"</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-200 px-4 py-3 font-medium">S</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">34-36</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">26-28</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">36-38</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">56-58</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">5'3" - 5'5"</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-200 px-4 py-3 font-medium">M</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">36-38</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">28-30</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">38-40</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">58-60</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">5'5" - 5'7"</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-200 px-4 py-3 font-medium">L</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">38-40</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">30-32</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">40-42</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">60-62</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">5'7" - 5'9"</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-200 px-4 py-3 font-medium">XL</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">40-42</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">32-34</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">42-44</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">62-64</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">5'9" - 6'0"</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-200 px-4 py-3 font-medium">XXL</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">42-44</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">34-36</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">44-46</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">64-66</td>
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">6'0" - 6'2"</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* How to Measure */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg text-black mb-4">How to Measure</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-black mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                      Bust
                    </h4>
                    <p className="text-sm text-gray-600">Measure around the fullest part of your bust, keeping the tape parallel to the floor.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-black mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                      Waist
                    </h4>
                    <p className="text-sm text-gray-600">Measure around your natural waistline, keeping the tape comfortably loose.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-black mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                      Hip
                    </h4>
                    <p className="text-sm text-gray-600">Measure around the fullest part of your hips, approximately 8 inches below your waist.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-black mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs">4</span>
                      Length
                    </h4>
                    <p className="text-sm text-gray-600">Measure from the shoulder seam down to your desired length (typically ankle or floor length).</p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="border-l-4 border-gold-500 bg-gold-50 p-4 rounded">
                <h4 className="font-semibold text-black mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sizing Tips
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-gold-600 mt-1">•</span>
                    <span>If you're between sizes, we recommend sizing up for a more comfortable fit.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-600 mt-1">•</span>
                    <span>All measurements are approximate and may vary slightly by style.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-600 mt-1">•</span>
                    <span>For custom sizing or specific questions, please contact our customer service.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-600 mt-1">•</span>
                    <span>Consider the fabric type - some materials have more stretch than others.</span>
                  </li>
                </ul>
              </div>

              {/* Contact Support */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Still not sure about your size?</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gold-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Us for Help
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuide 
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        category={product?.category || "burka"}
      />
    </div>
  );
}
