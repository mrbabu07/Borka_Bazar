import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../services/api";
import ProductCardPremium from "../components/ProductCardPremium";
import { ProductCardSkeleton } from "../components/Skeleton";

export default function ProductsPremium() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableFabrics, setAvailableFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    fabric: searchParams.get("fabric") || "",
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
    sort: searchParams.get("sort") || "newest",
  });

  const sizes = ["38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58", "60"];
  const colors = ["Black", "White", "Navy", "Maroon", "Green", "Brown", "Gray"];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      let filteredProducts = productsRes.data.data;

      // Extract unique fabrics from products
      const uniqueFabrics = [...new Set(
        filteredProducts
          .map(p => p.fabric)
          .filter(f => f && f.trim() !== "")
      )].sort();
      setAvailableFabrics(uniqueFabrics);

      // Apply filters
      if (filters.category) {
        filteredProducts = filteredProducts.filter(
          (p) => p.category?.slug === filters.category
        );
      }
      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(
          (p) => p.price >= Number(filters.minPrice)
        );
      }
      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(
          (p) => p.price <= Number(filters.maxPrice)
        );
      }
      if (filters.fabric) {
        filteredProducts = filteredProducts.filter(
          (p) => p.fabric?.toLowerCase() === filters.fabric.toLowerCase()
        );
      }
      if (filters.size) {
        // Map burka sizes to database sizes
        const sizeMap = {
          "38": "S",
          "40": "S",
          "42": "M",
          "44": "L",
          "46": "L",
          "48": "XL",
          "50": "XL",
          "52": "XXL",
          "54": "XXL",
          "56": "Free Size",
          "58": "Free Size",
          "60": "Free Size",
        };
        const dbSize = sizeMap[filters.size] || filters.size;
        filteredProducts = filteredProducts.filter(
          (p) => p.sizes?.includes(dbSize)
        );
      }
      if (filters.color) {
        filteredProducts = filteredProducts.filter(
          (p) => p.colors?.some(c => c.toLowerCase() === filters.color.toLowerCase())
        );
      }

      // Apply sorting
      if (filters.sort === "price-low") {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (filters.sort === "price-high") {
        filteredProducts.sort((a, b) => b.price - a.price);
      } else if (filters.sort === "newest") {
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setProducts(filteredProducts);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      fabric: "",
      size: "",
      color: "",
      sort: "newest",
    });
    setSearchParams({});
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v && v !== "newest"
  ).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl md:text-4xl text-black text-center mb-4">
            Shop Collection
          </h1>
          <p className="text-gray-500 text-center max-w-2xl mx-auto">
            Discover our complete range of elegant modest fashion
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-12">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block lg:col-span-1 space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm tracking-widest uppercase font-medium text-black">
                Filters
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-black transition-colors"
                >
                  Clear All ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                Category
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === ""}
                    onChange={() => handleFilterChange("category", "")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                    All Categories
                  </span>
                </label>
                {categories.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={filters.category === cat.slug}
                      onChange={() => handleFilterChange("category", cat.slug)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                Price Range
              </h3>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 text-sm focus:border-black focus:outline-none transition-colors"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 text-sm focus:border-black focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Fabric Filter */}
            <div>
              <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                Fabric
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="fabric"
                    checked={filters.fabric === ""}
                    onChange={() => handleFilterChange("fabric", "")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                    All Fabrics
                  </span>
                </label>
                {availableFabrics.map((fabric) => (
                  <label key={fabric} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="fabric"
                      checked={filters.fabric === fabric}
                      onChange={() => handleFilterChange("fabric", fabric)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                      {fabric}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      handleFilterChange("size", filters.size === size ? "" : size)
                    }
                    className={`px-4 py-2 border text-sm transition-all ${
                      filters.size === size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 text-gray-700 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                Color
              </h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      handleFilterChange("color", filters.color === color ? "" : color)
                    }
                    className={`px-4 py-2 border text-sm transition-all ${
                      filters.color === color
                        ? "border-black bg-black text-white"
                        : "border-gray-300 text-gray-700 hover:border-black"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full py-3 border border-black text-black text-sm tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-all"
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Sort & Results Count */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                {loading ? "Loading..." : `${products.length} Products`}
              </p>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="px-4 py-2 border border-gray-300 text-sm focus:border-black focus:outline-none transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">No products found</p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gold-600 hover:text-gold-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {products.map((product) => (
                  <ProductCardPremium key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-black">Filters</h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile filter content - same as desktop */}
              <div className="space-y-8">
                {/* Category Filter */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                    Category
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="category-mobile"
                        checked={filters.category === ""}
                        onChange={() => handleFilterChange("category", "")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                        All Categories
                      </span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat._id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="category-mobile"
                          checked={filters.category === cat.slug}
                          onChange={() => handleFilterChange("category", cat.slug)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                    Price Range
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 text-sm focus:border-black focus:outline-none transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 text-sm focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Fabric Filter */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                    Fabric
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="fabric-mobile"
                        checked={filters.fabric === ""}
                        onChange={() => handleFilterChange("fabric", "")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                        All Fabrics
                      </span>
                    </label>
                    {availableFabrics.map((fabric) => (
                      <label key={fabric} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="fabric-mobile"
                          checked={filters.fabric === fabric}
                          onChange={() => handleFilterChange("fabric", fabric)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                          {fabric}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Filter */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                    Size
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() =>
                          handleFilterChange("size", filters.size === size ? "" : size)
                        }
                        className={`px-4 py-2 border text-sm transition-all ${
                          filters.size === size
                            ? "border-black bg-black text-white"
                            : "border-gray-300 text-gray-700 hover:border-black"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Filter */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-4 uppercase tracking-wide">
                    Color
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          handleFilterChange("color", filters.color === color ? "" : color)
                        }
                        className={`px-4 py-2 border text-sm transition-all ${
                          filters.color === color
                            ? "border-black bg-black text-white"
                            : "border-gray-300 text-gray-700 hover:border-black"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 border border-gray-300 text-sm tracking-widest uppercase font-medium hover:border-black transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 py-3 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
