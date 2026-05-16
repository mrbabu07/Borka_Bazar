import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { getProducts, getCategories } from "../services/api";
import ProductCardPremium from "../components/ProductCardPremium";
import HeroSectionPremium from "../components/HeroSectionPremium";
import { ProductCardSkeleton } from "../components/Skeleton";
import { getArrayData } from "../utils/apiConfig";
import { getCategoryImage } from "../utils/categoryVisuals";

export default function HomePremium() {
  const [products, setProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      const allProducts = getArrayData(productsRes);
      setProducts(allProducts.slice(0, 8));
      setNewArrivals(allProducts.slice(-4).reverse());
      setCategories(getArrayData(categoriesRes));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: "Premium Quality",
      description: "Handpicked fabrics and meticulous craftsmanship",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Fast Delivery",
      description: "Express shipping across Bangladesh",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: "Easy Returns",
      description: "7-day hassle-free return policy",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Secure Payment",
      description: "Safe and secure transactions",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Section */}
      <HeroSectionPremium />

      {/* Features Bar */}
      <section className="border-y border-gray-100 bg-white py-10 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-100 bg-gray-50 p-6 text-left transition hover:-translate-y-0.5 hover:border-gray-200 hover:bg-white hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-900"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white text-gold-500 shadow-sm dark:bg-gray-950">
                  {feature.icon}
                </div>
                <h3 className="text-sm tracking-widest uppercase font-medium text-black dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      {categories.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-gold-500 text-sm tracking-[0.3em] uppercase mb-3">
                Explore
              </p>
              <h2 className="text-3xl font-black tracking-tight text-black dark:text-white md:text-4xl">
                Shop by Category
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Discover our curated collections designed for every occasion
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              {categories.slice(0, 4).map((category) => {
                const Icon = getCategoryIcon(category.name);
                const theme = getCategoryTheme(category.name);
                const categoryImage = getCategoryImage(category.name);

                return (
                  <Link
                    key={category._id}
                    to={`/category/${category.slug}`}
                    className="group flex min-h-32 flex-col items-center justify-center rounded-lg border border-gray-100 bg-white px-3 py-4 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-rose-900/60"
                  >
                    <div className={`mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-sm ring-2 ring-white transition group-hover:scale-110 dark:ring-gray-800 ${categoryImage ? "bg-white" : theme.icon}`}>
                      {categoryImage ? (
                        <img
                          src={categoryImage}
                          alt={category.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Icon className="h-7 w-7 text-white" strokeWidth={1.8} />
                      )}
                    </div>
                    <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-gray-800 transition group-hover:text-rose-600 dark:text-gray-100 dark:group-hover:text-rose-300">
                      {category.name}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="bg-gray-50 py-20 transition-colors duration-300 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-gold-500 text-sm tracking-[0.3em] uppercase mb-3">
              Curated Selection
            </p>
            <h2 className="text-3xl font-black tracking-tight text-black dark:text-white md:text-4xl">
              Featured Collection
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Handpicked pieces that embody elegance and modesty
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4">No products available yet</p>
              <p className="text-sm text-gray-400">
                Run: cd Server && npm run seed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {products.map((product) => (
                <ProductCardPremium key={product._id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex rounded-lg border border-black px-10 py-3.5 text-sm font-bold uppercase tracking-widest text-black transition hover:-translate-y-0.5 hover:bg-black hover:text-white hover:shadow-md dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-gold-500 text-sm tracking-[0.3em] uppercase mb-3">
                Just In
              </p>
              <h2 className="text-3xl font-black tracking-tight text-black dark:text-white md:text-4xl">
                New Arrivals
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Be the first to discover our latest designs
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {newArrivals.map((product) => (
                <ProductCardPremium key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-gold-500 text-sm tracking-[0.3em] uppercase mb-3">
              Popular Choices
            </p>
            <h2 className="text-3xl font-black tracking-tight text-black dark:text-white md:text-4xl">
              Best Sellers
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Our most loved pieces, chosen by customers like you
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {products.slice(0, 4).map((product) => (
                <ProductCardPremium key={product._id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function getCategoryIcon(categoryName = "") {
  const name = categoryName.toLowerCase();
  if (name.includes("men") || name.includes("man")) return Shirt;
  if (
    name.includes("women") ||
    name.includes("woman") ||
    name.includes("ladies") ||
    name.includes("burka") ||
    name.includes("abaya") ||
    name.includes("hijab") ||
    name.includes("niqab") ||
    name.includes("nikab")
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
      card: "border-rose-100 bg-gradient-to-br from-white via-rose-50 to-pink-50 hover:border-rose-200 dark:border-rose-900/40 dark:from-gray-900 dark:via-rose-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-rose-500 to-fuchsia-600",
      arrow: "bg-rose-100 text-rose-600 group-hover:bg-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
      label: "text-rose-600 dark:text-rose-300",
      glow: "bg-rose-200 dark:bg-rose-800/40",
    };
  }

  if (
    name.includes("electronic") ||
    name.includes("phone") ||
    name.includes("tech")
  ) {
    return {
      card: "border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 hover:border-sky-200 dark:border-sky-900/40 dark:from-gray-900 dark:via-sky-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-sky-500 to-blue-600",
      arrow: "bg-sky-100 text-sky-600 group-hover:bg-sky-600 dark:bg-sky-950/50 dark:text-sky-300",
      label: "text-sky-600 dark:text-sky-300",
      glow: "bg-sky-200 dark:bg-sky-800/40",
    };
  }

  if (name.includes("baby") || name.includes("kid") || name.includes("child")) {
    return {
      card: "border-amber-100 bg-gradient-to-br from-white via-amber-50 to-orange-50 hover:border-amber-200 dark:border-amber-900/40 dark:from-gray-900 dark:via-amber-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-amber-400 to-orange-500",
      arrow: "bg-amber-100 text-amber-700 group-hover:bg-amber-500 dark:bg-amber-950/50 dark:text-amber-300",
      label: "text-amber-700 dark:text-amber-300",
      glow: "bg-amber-200 dark:bg-amber-800/40",
    };
  }

  if (name.includes("home") || name.includes("furniture")) {
    return {
      card: "border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-teal-50 hover:border-emerald-200 dark:border-emerald-900/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-emerald-500 to-teal-600",
      arrow: "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
      label: "text-emerald-700 dark:text-emerald-300",
      glow: "bg-emerald-200 dark:bg-emerald-800/40",
    };
  }

  if (name.includes("sport") || name.includes("fitness")) {
    return {
      card: "border-lime-100 bg-gradient-to-br from-white via-lime-50 to-green-50 hover:border-lime-200 dark:border-lime-900/40 dark:from-gray-900 dark:via-lime-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-lime-500 to-green-600",
      arrow: "bg-lime-100 text-lime-700 group-hover:bg-lime-600 dark:bg-lime-950/50 dark:text-lime-300",
      label: "text-lime-700 dark:text-lime-300",
      glow: "bg-lime-200 dark:bg-lime-800/40",
    };
  }

  if (name.includes("book") || name.includes("education")) {
    return {
      card: "border-violet-100 bg-gradient-to-br from-white via-violet-50 to-purple-50 hover:border-violet-200 dark:border-violet-900/40 dark:from-gray-900 dark:via-violet-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-violet-500 to-purple-600",
      arrow: "bg-violet-100 text-violet-700 group-hover:bg-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
      label: "text-violet-700 dark:text-violet-300",
      glow: "bg-violet-200 dark:bg-violet-800/40",
    };
  }

  if (name.includes("men") || name.includes("man")) {
    return {
      card: "border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-50 hover:border-indigo-200 dark:border-indigo-900/40 dark:from-gray-900 dark:via-indigo-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-indigo-500 to-slate-700",
      arrow: "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300",
      label: "text-indigo-700 dark:text-indigo-300",
      glow: "bg-indigo-200 dark:bg-indigo-800/40",
    };
  }

  return {
    card: "border-orange-100 bg-gradient-to-br from-white via-orange-50 to-yellow-50 hover:border-orange-200 dark:border-orange-900/40 dark:from-gray-900 dark:via-orange-950/20 dark:to-gray-900",
    icon: "bg-gradient-to-br from-orange-500 to-red-500",
    arrow: "bg-orange-100 text-orange-700 group-hover:bg-orange-500 dark:bg-orange-950/50 dark:text-orange-300",
    label: "text-orange-700 dark:text-orange-300",
    glow: "bg-orange-200 dark:bg-orange-800/40",
  };
}
