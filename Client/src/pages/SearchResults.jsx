import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getProducts } from "../services/api";
import ProductCardPremium from "../components/ProductCardPremium";
import { ProductCardSkeleton } from "../components/Skeleton";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    if (query) {
      searchProducts();
    }
  }, [query, sortBy]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      const allProducts = response.data.data || [];

      // Simple client-side search
      let filtered = allProducts.filter(
        (product) =>
          product.title.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase()) ||
          product.fabric?.toLowerCase().includes(query.toLowerCase()) ||
          product.category?.name?.toLowerCase().includes(query.toLowerCase()),
      );

      // Apply sorting
      if (sortBy === "price-low") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-high") {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortBy === "newest") {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setProducts(filtered);
    } catch (error) {
      console.error("Failed to search products:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-black">Search Results</span>
          </nav>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl text-black mb-4">
            Search Results
          </h1>
          <p className="text-gray-500">
            Showing results for "{query}"
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Toolbar - Premium Style */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            {loading ? "Searching..." : `${products.length} ${products.length === 1 ? "Product" : "Products"} Found`}
          </p>

          {!loading && products.length > 0 && (
            <div className="flex items-center gap-4">
              {/* Sort Dropdown - Premium Style */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 text-sm focus:border-black focus:outline-none transition-colors"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="font-display text-2xl text-black mb-4">
              No products found
            </h3>
            <p className="text-gray-500 mb-8">
              Try searching with different keywords or browse our categories
            </p>
            <Link
              to="/products"
              className="inline-block px-12 py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCardPremium key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
