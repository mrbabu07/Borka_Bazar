import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getProducts, getCategories } from "../services/api";
import ProductCardPremium from "../components/ProductCardPremium";
import { ProductCardSkeleton } from "../components/Skeleton";

export default function CategoryPage() {
  const { category } = useParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  // Determine if this is "all categories" or "all products" page
  const isAllCategories = location.pathname === "/categories";
  const isAllProducts =
    location.pathname === "/products" || (!category && !isAllCategories);

  // Extract category from legacy routes
  const getCurrentCategory = () => {
    if (category) return category; // Dynamic route like /category/mens

    // Legacy routes
    const path = location.pathname.slice(1); // Remove leading slash
    if (
      path === "mens" ||
      path === "womens" ||
      path === "electronics" ||
      path === "baby"
    ) {
      return path;
    }

    return null;
  };

  const currentCategorySlug = getCurrentCategory();

  // Define category info first
  const categoryInfo = {
    mens: {
      name: "Men's Collection",
      description: "Discover the latest trends in men's fashion",
      image:
        "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1200&h=400&fit=crop",
    },
    womens: {
      name: "Women's Collection",
      description: "Elegant styles for the modern woman",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop",
    },
    electronics: {
      name: "Electronics",
      description: "Latest gadgets and tech essentials",
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=400&fit=crop",
    },
    baby: {
      name: "Baby & Kids",
      description: "Everything for your little ones",
      image:
        "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&h=400&fit=crop",
    },
  };

  // Get current page info
  const getCurrentPageInfo = () => {
    if (isAllCategories) {
      return {
        name: "All Categories",
        description: "Browse all available categories",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
      };
    }

    if (isAllProducts) {
      return {
        name: "All Products",
        description: "Discover our complete collection",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
      };
    }

    return (
      categoryInfo[currentCategorySlug] || {
        name: "Products",
        description: "Browse our collection",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
      }
    );
  };

  const currentCategory = getCurrentPageInfo();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let categoryId = null;

      if (currentCategorySlug && !isAllProducts) {
        try {
          const categoriesResponse = await getCategories();
          const allCategories = categoriesResponse.data.data || [];
          const matchedCategory = allCategories.find(
            (cat) => cat.slug === currentCategorySlug,
          );

          if (matchedCategory) {
            categoryId = matchedCategory._id;
          }
        } catch (catError) {
          console.error("Failed to fetch categories:", catError);
        }
      }

      const queryParams = categoryId ? { category: categoryId } : {};
      const response = await getProducts(queryParams);
      let fetchedProducts = response.data.data || [];

      // Apply sorting
      if (sortBy === "price-low") {
        fetchedProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-high") {
        fetchedProducts.sort((a, b) => b.price - a.price);
      } else if (sortBy === "newest") {
        fetchedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAllCategories) {
      fetchCategories();
    } else {
      fetchProducts();
    }
  }, [category, currentCategorySlug, isAllCategories, location.pathname, sortBy]);

  return (
    <div className="min-h-screen bg-white">
      {/* Category Hero Banner - Premium Style */}
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
            <span className="text-black">{currentCategory.name}</span>
          </nav>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl text-black mb-4">
            {currentCategory.name}
          </h1>
          <p className="text-gray-500 max-w-2xl">
            {currentCategory.description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Toolbar - Premium Style */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            {loading ? "Loading..." : `${products.length} Products`}
          </p>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown - Premium Style */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 text-sm focus:border-black focus:outline-none transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products/Categories Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : isAllCategories ? (
          // Show categories grid - Premium Style
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/category/${cat.slug}`}
                className="group relative aspect-[3/4] overflow-hidden"
              >
                <img
                  src={cat.image || "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop"}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <h3 className="font-display text-xl text-white">
                    {cat.name}
                  </h3>
                </div>
              </Link>
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="font-display text-2xl text-black mb-4">
              No products found
            </h3>
            <p className="text-gray-500 mb-8">
              We couldn't find any products in this category.
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
