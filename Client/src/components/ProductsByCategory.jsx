import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Dumbbell,
  Home,
  PackageSearch,
  Palette,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";
import ProductCard from "./ProductCard";
import { API_URL, getArrayData } from "../utils/apiConfig";
import { getCategoryImage } from "../utils/categoryVisuals";

export default function ProductsByCategory() {
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesWithProducts();
  }, []);

  const fetchCategoriesWithProducts = async () => {
    try {
      const categoriesResponse = await axios.get(`${API_URL}/categories`);
      const categories = getArrayData(categoriesResponse);

      const productsResponse = await axios.get(`${API_URL}/products`);
      const allProducts = getArrayData(productsResponse);

      const categoriesWithProductsData = categories
        .map((category) => {
          const categoryProducts = allProducts.filter(
            (product) => product.categoryId === category._id,
          );
          return {
            ...category,
            products: categoryProducts.slice(0, 4),
            totalProducts: categoryProducts.length,
          };
        })
        .filter((category) => category.products.length > 0);

      setCategoriesWithProducts(categoriesWithProductsData);
    } catch (error) {
      console.error("Error fetching categories with products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-16 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-8 h-8 w-64 rounded bg-gray-200 dark:bg-gray-700"></div>
            {[1, 2].map((i) => (
              <div key={i} className="mb-12">
                <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div
                      key={j}
                      className="h-80 rounded-lg bg-gray-200 dark:bg-gray-700"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categoriesWithProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-gold-600 dark:text-gold-400">
            Curated ranges
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Shop by Category
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-400">
            Discover our curated collections across different categories.
          </p>
        </div>

        <div className="space-y-16">
          {categoriesWithProducts.map((category, index) => {
            const Icon = getCategoryIcon(category.name);
            const theme = getCategoryTheme(category.name);
            const categoryImage = getCategoryImage(category.name);

            return (
              <div key={category._id} className="relative">
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-white shadow-sm ${categoryImage ? "bg-white ring-2 ring-white dark:ring-gray-800" : theme.icon}`}
                    >
                      {categoryImage ? (
                        <img
                          src={categoryImage}
                          alt={category.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.totalProducts} products available
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/category/${category.slug}`}
                    className={`group inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:text-white ${theme.button}`}
                  >
                    <span>View All</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                  {category.products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {index < categoriesWithProducts.length - 1 && (
                  <div className="mt-12 border-t border-gray-200 dark:border-gray-800"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-3 rounded-lg bg-gray-950 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
          >
            <span>Explore All Products</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function getCategoryIcon(categoryName) {
  const name = categoryName.toLowerCase();
  if (name.includes("men") || name.includes("man")) return Shirt;
  if (
    name.includes("women") ||
    name.includes("woman") ||
    name.includes("ladies") ||
    name.includes("burka") ||
    name.includes("abaya") ||
    name.includes("hijab")
  ) {
    return Sparkles;
  }
  if (
    name.includes("electronic") ||
    name.includes("phone") ||
    name.includes("tech")
  ) {
    return Smartphone;
  }
  if (name.includes("baby") || name.includes("kid") || name.includes("child")) {
    return Baby;
  }
  if (name.includes("beauty") || name.includes("cosmetic")) return Sparkles;
  if (name.includes("shoe") || name.includes("footwear")) return ShoppingBag;
  if (name.includes("game") || name.includes("toy")) return Palette;
  if (name.includes("home") || name.includes("furniture")) return Home;
  if (name.includes("book") || name.includes("education")) return BookOpen;
  if (name.includes("sport") || name.includes("fitness")) return Dumbbell;
  return PackageSearch;
}

function getCategoryTheme(categoryName = "") {
  const name = categoryName.toLowerCase();

  if (
    name.includes("women") ||
    name.includes("ladies") ||
    name.includes("burka") ||
    name.includes("abaya") ||
    name.includes("hijab") ||
    name.includes("niqab") ||
    name.includes("nikab") ||
    name.includes("beauty") ||
    name.includes("cosmetic")
  ) {
    return {
      icon: "bg-gradient-to-br from-rose-500 to-fuchsia-600",
      button: "border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-600 hover:bg-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300",
    };
  }

  if (
    name.includes("electronic") ||
    name.includes("phone") ||
    name.includes("tech")
  ) {
    return {
      icon: "bg-gradient-to-br from-sky-500 to-blue-600",
      button: "border border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-600 hover:bg-sky-600 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300",
    };
  }

  if (name.includes("baby") || name.includes("kid") || name.includes("child")) {
    return {
      icon: "bg-gradient-to-br from-amber-400 to-orange-500",
      button: "border border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-500 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    };
  }

  if (name.includes("home") || name.includes("furniture")) {
    return {
      icon: "bg-gradient-to-br from-emerald-500 to-teal-600",
      button: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    };
  }

  if (name.includes("sport") || name.includes("fitness")) {
    return {
      icon: "bg-gradient-to-br from-lime-500 to-green-600",
      button: "border border-lime-200 bg-lime-50 text-lime-700 hover:border-lime-600 hover:bg-lime-600 dark:border-lime-900/50 dark:bg-lime-950/30 dark:text-lime-300",
    };
  }

  if (name.includes("book") || name.includes("education")) {
    return {
      icon: "bg-gradient-to-br from-violet-500 to-purple-600",
      button: "border border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-600 hover:bg-violet-600 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300",
    };
  }

  if (name.includes("men") || name.includes("man")) {
    return {
      icon: "bg-gradient-to-br from-indigo-500 to-slate-700",
      button: "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-600 hover:bg-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300",
    };
  }

  return {
    icon: "bg-gradient-to-br from-orange-500 to-red-500",
    button: "border border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-500 hover:bg-orange-500 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300",
  };
}
