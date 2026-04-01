import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../services/api";

export default function HeroSectionPremium() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await getProducts();
      const products = response.data.data || [];
      // Get 3 random products for hero carousel
      const shuffled = products.sort(() => 0.5 - Math.random());
      setFeaturedProducts(shuffled.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate slides
  useEffect(() => {
    if (featuredProducts.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [featuredProducts.length]);

  if (loading || featuredProducts.length === 0) {
    return (
      <section className="relative h-[70vh] md:h-[80vh] lg:h-[85vh] bg-gray-100 dark:bg-gray-800 animate-pulse transition-colors duration-300">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
      {/* Slides */}
      {featuredProducts.map((product, index) => (
        <div
          key={product._id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentSlide
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={product.images?.[0] || product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-2xl">
              {/* Category Badge */}
              {product.category && (
                <p className="text-gold-500 text-sm md:text-base tracking-[0.3em] uppercase mb-4 animate-fade-in">
                  {product.category}
                </p>
              )}

              {/* Title */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-6 leading-tight animate-slide-up">
                {product.title}
              </h1>

              {/* Description */}
              {product.description && (
                <p className="text-white/90 text-base md:text-lg mb-6 max-w-xl leading-relaxed animate-slide-up delay-200 line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* Product Details */}
              <div className="flex flex-wrap gap-4 mb-8 text-white/80 text-sm animate-slide-up delay-200">
                {product.fabric && (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    {product.fabric}
                  </span>
                )}
                {product.availableSizes?.length > 0 && (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {product.availableSizes.length} Sizes Available
                  </span>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 animate-slide-up delay-300">
                <Link
                  to={`/product/${product._id}`}
                  className="inline-block px-10 md:px-12 py-4 bg-white text-black text-sm tracking-[0.2em] uppercase font-medium hover:bg-gold-500 hover:text-white transition-all duration-300"
                >
                  View Details
                </Link>
                <Link
                  to="/products"
                  className="inline-block px-10 md:px-12 py-4 border-2 border-white text-white text-sm tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-black transition-all duration-300"
                >
                  Shop All
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {featuredProducts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? "w-12 h-1 bg-white"
                : "w-8 h-1 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() =>
          setCurrentSlide(
            (prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length
          )
        }
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white hover:text-gold-500 transition-colors z-10 group"
        aria-label="Previous slide"
      >
        <svg
          className="w-8 h-8 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={() =>
          setCurrentSlide((prev) => (prev + 1) % featuredProducts.length)
        }
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white hover:text-gold-500 transition-colors z-10 group"
        aria-label="Next slide"
      >
        <svg
          className="w-8 h-8 group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </section>
  );
}
