import { Link } from "react-router-dom";
import useWishlist from "../hooks/useWishlist";
import useCart from "../hooks/useCart";
import WishlistButton from "../components/WishlistButton";
import WishlistShare from "../components/WishlistShare";
import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../firebase/firebase.config";
import { toast } from "react-hot-toast";

export default function Wishlist() {
  const { wishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState("");

  const handleTogglePublic = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Please login");
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/wishlist/toggle-public`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setIsPublic(response.data.isPublic);
        if (response.data.shareId) {
          setShareId(response.data.shareId);
        }
      }
    } catch (error) {
      console.error("Failed to toggle wishlist public:", error);
    }
  };

  // Fetch wishlist data to get shareId and isPublic status
  useEffect(() => {
    const fetchWishlistData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/wishlist`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success && response.data.data) {
          setIsPublic(response.data.data.isPublic || false);
          setShareId(response.data.data.shareId || "");
        }
      } catch (error) {
        console.error("Failed to fetch wishlist data:", error);
      }
    };

    if (!loading && auth.currentUser) {
      fetchWishlistData();
    }
  }, [loading]);

  const handleAddToCart = (product) => {
    const imageToUse = product.image || (product.images && product.images[0]);
    addToCart(product, 1, imageToUse);
    toast.success("Added to cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header - Premium Style */}
      <div className="bg-gray-50 border-b border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-black transition">
              Home
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-black">Wishlist</span>
          </nav>

          {/* Title & Share */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-black mb-2">
                My Wishlist
              </h1>
              <p className="text-gray-500">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved for later
              </p>
            </div>

            {/* Share Button */}
            {wishlist.length > 0 && (
              <WishlistShare
                wishlistId={shareId}
                isPublic={isPublic}
                onTogglePublic={handleTogglePublic}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-24 h-24 mx-auto mb-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="font-display text-2xl text-black mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-8">
              Save items you love to your wishlist and shop them later
            </p>
            <Link
              to="/products"
              className="inline-block px-12 py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {wishlist.map((product) => (
                <div key={product._id} className="group relative bg-white">
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                    <Link to={`/product/${product._id}`}>
                      <img
                        src={product.image || (product.images && product.images[0])}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </Link>

                    {/* Wishlist Button */}
                    <div className="absolute top-4 right-4 z-10">
                      <WishlistButton product={product} size="md" />
                    </div>

                    {/* Stock Badge */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="absolute top-4 left-4 bg-gold-500 text-white text-xs font-medium px-3 py-1 tracking-wide">
                        Only {product.stock} left
                      </span>
                    )}
                    {product.stock === 0 && (
                      <span className="absolute top-4 left-4 bg-black text-white text-xs font-medium px-3 py-1 tracking-wide">
                        Out of Stock
                      </span>
                    )}

                    {/* Hover Overlay with Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors">
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="px-8 py-3 bg-white text-black text-sm tracking-widest uppercase font-medium hover:bg-gold-500 hover:text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6 text-center">
                    <Link to={`/product/${product._id}`}>
                      <h3 className="font-display text-base md:text-lg text-black group-hover:text-gold-600 transition-colors leading-tight min-h-[3rem] line-clamp-2 mb-2">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Fabric/Style Info */}
                    {(product.fabric || product.style) && (
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                        {product.fabric || product.style}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-lg md:text-xl font-semibold text-black">
                        ৳{product.price?.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                          ৳{product.originalPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-12 text-center">
              <Link
                to="/products"
                className="inline-block px-12 py-4 border-2 border-black text-black text-sm tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
