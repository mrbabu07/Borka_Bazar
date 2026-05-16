import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  BookOpen,
  ChevronRight,
  Dumbbell,
  Grid3X3,
  Home,
  PackageOpen,
  PackageSearch,
  Palette,
  Shirt,
  SlidersHorizontal,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { getProducts, getCategories } from "../services/api";
import ProductCardPremium from "../components/ProductCardPremium";
import { ProductCardSkeleton } from "../components/Skeleton";
import { getArrayData } from "../utils/apiConfig";
import { getCategoryImage } from "../utils/categoryVisuals";

export default function CategoryPage() {
  const { category } = useParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategoryDetails, setCurrentCategoryDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  const isAllCategories = location.pathname === "/categories";
  const isAllProducts =
    location.pathname === "/products" || (!category && !isAllCategories);

  const getCurrentCategory = () => {
    if (category) return category;

    const path = location.pathname.slice(1);
    if (
      path === "mens" ||
      path === "womens" ||
      path === "electronics" ||
      path === "baby" ||
      path === "hijab" ||
      path === "niqab" ||
      path === "nikab"
    ) {
      return path;
    }

    return null;
  };

  const currentCategorySlug = getCurrentCategory();

  const categoryInfo = {
    mens: {
      name: "Men's Collection",
      description: "Tailored everyday essentials and refined casual pieces.",
      image:
        "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1600&h=700&fit=crop",
    },
    womens: {
      name: "Women's Collection",
      description: "Elegant styles curated for comfort, modesty, and polish.",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=700&fit=crop",
    },
    electronics: {
      name: "Electronics",
      description: "Useful tech, smart accessories, and everyday gadgets.",
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&h=700&fit=crop",
    },
    baby: {
      name: "Baby & Kids",
      description: "Comfortable picks for little ones and growing families.",
      image:
        "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1600&h=700&fit=crop",
    },
    hijab: {
      name: "Hijab",
      description: "Hijabs and scarves for everyday wear and occasion styling.",
      image:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1600&h=700&fit=crop",
    },
    niqab: {
      name: "Niqab",
      description: "Comfortable face veils and niqab styles for modest coverage.",
      image:
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1600&h=700&fit=crop",
    },
    nikab: {
      name: "Niqab",
      description: "Comfortable face veils and niqab styles for modest coverage.",
      image:
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1600&h=700&fit=crop",
    },
  };

  const getCurrentPageInfo = () => {
    if (isAllCategories) {
      return {
        name: "Categories",
        eyebrow: "Shop the range",
        description: "Move through every collection from one clean, focused place.",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=700&fit=crop",
      };
    }

    if (isAllProducts) {
      return {
        name: "All Products",
        eyebrow: "Complete collection",
        description: "Discover every product available in the store.",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=700&fit=crop",
      };
    }

    if (currentCategoryDetails) {
      return {
        name: currentCategoryDetails.name || "Products",
        eyebrow: "Collection",
        description:
          currentCategoryDetails.description || "Browse our curated collection.",
        image:
          currentCategoryDetails.image ||
          getFallbackImage(currentCategoryDetails.name),
      };
    }

    return (
      categoryInfo[currentCategorySlug] || {
        name: "Products",
        eyebrow: "Collection",
        description: "Browse our curated collection.",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=700&fit=crop",
      }
    );
  };

  const currentCategory = getCurrentPageInfo();

  const fetchCategories = async () => {
    setLoading(true);
    setCurrentCategoryDetails(null);
    try {
      const response = await getCategories();
      setCategories(getArrayData(response));
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
      let allCategories = categories;

      if (currentCategorySlug && !isAllProducts) {
        try {
          const categoriesResponse = await getCategories();
          allCategories = getArrayData(categoriesResponse);
          setCategories(allCategories);

          const matchedCategory = allCategories.find(
            (cat) => cat.slug === currentCategorySlug,
          );

          if (matchedCategory) {
            categoryId = matchedCategory._id;
            setCurrentCategoryDetails(matchedCategory);
          } else {
            setCurrentCategoryDetails(null);
          }
        } catch (catError) {
          console.error("Failed to fetch categories:", catError);
        }
      } else if (allCategories.length === 0) {
        try {
          const categoriesResponse = await getCategories();
          setCategories(getArrayData(categoriesResponse));
        } catch (catError) {
          console.error("Failed to fetch categories:", catError);
        }
      }

      const queryParams = categoryId ? { category: categoryId } : {};
      const response = await getProducts(queryParams);
      let fetchedProducts = getArrayData(response);

      if (sortBy === "price-low") {
        fetchedProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-high") {
        fetchedProducts.sort((a, b) => b.price - a.price);
      } else if (sortBy === "newest") {
        fetchedProducts.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <section className="relative overflow-hidden bg-gray-950">
        <div className="absolute inset-0">
          <img
            src={currentCategory.image}
            alt={currentCategory.name}
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/20"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-sm text-white/70">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{currentCategory.name}</span>
          </nav>

          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-gold-300 backdrop-blur">
              <Grid3X3 className="h-4 w-4" />
              {currentCategory.eyebrow || "Collection"}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              {currentCategory.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 md:text-lg">
              {currentCategory.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur">
                <span className="block text-2xl font-bold">
                  {isAllCategories ? categories.length : products.length}
                </span>
                <span className="text-xs uppercase tracking-widest text-white/70">
                  {isAllCategories ? "Categories" : "Products"}
                </span>
              </div>
              <Link
                to={isAllCategories ? "/products" : "/categories"}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold uppercase tracking-widest text-gray-950 transition hover:bg-gold-300"
              >
                {isAllCategories ? "Shop Products" : "View Categories"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {!isAllCategories && categories.length > 0 && (
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <CategoryPill to="/products" active={isAllProducts}>
              All
            </CategoryPill>
            {categories.map((cat) => (
              <CategoryPill
                key={cat._id}
                to={`/category/${cat.slug}`}
                active={cat.slug === currentCategorySlug}
              >
                {cat.name}
              </CategoryPill>
            ))}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
              {isAllCategories ? "Browse" : "Products"}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {loading
                ? "Loading..."
                : isAllCategories
                  ? `${categories.length} categories available`
                  : `${products.length} products available`}
            </p>
          </div>

          {!isAllCategories && (
            <label className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-950 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-white"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </label>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : isAllCategories ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const theme = getCategoryTheme(cat.name);
              const categoryImage = getCategoryImage(cat.name);

              return (
                <Link
                  key={cat._id}
                  to={`/category/${cat.slug}`}
                  className="group flex min-h-32 flex-col items-center justify-center rounded-lg border border-gray-100 bg-white px-3 py-4 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-rose-900/60"
                >
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-sm ring-2 ring-white transition group-hover:scale-110 dark:ring-gray-800 ${categoryImage ? "bg-white" : theme.icon}`}>
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={cat.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Icon className="h-7 w-7 text-white" strokeWidth={1.8} />
                    )}
                  </div>
                  <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-gray-800 transition group-hover:text-rose-600 dark:text-gray-100 dark:group-hover:text-rose-300">
                    {cat.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        ) : products.length === 0 ? (
          <div className="mx-auto max-w-lg py-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900">
              <PackageOpen className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-semibold text-black dark:text-white">
              No products found
            </h3>
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              We could not find any products in this category.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gray-950 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
            >
              Browse All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCardPremium key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CategoryPill({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-gray-950 bg-gray-950 text-white dark:border-white dark:bg-white dark:text-gray-950"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-950 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function getFallbackImage(categoryName = "") {
  const name = categoryName.toLowerCase();
  if (name.includes("men") || name.includes("man")) {
    return "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=700&h=900&fit=crop";
  }
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
    return "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=700&h=900&fit=crop";
  }
  if (
    name.includes("electronic") ||
    name.includes("phone") ||
    name.includes("tech")
  ) {
    return "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700&h=900&fit=crop";
  }
  if (name.includes("baby") || name.includes("kid") || name.includes("child")) {
    return "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700&h=900&fit=crop";
  }
  if (name.includes("beauty") || name.includes("cosmetic")) {
    return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=700&h=900&fit=crop";
  }
  if (name.includes("home") || name.includes("furniture")) {
    return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&h=900&fit=crop";
  }
  if (name.includes("book") || name.includes("education")) {
    return "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=700&h=900&fit=crop";
  }
  if (name.includes("sport") || name.includes("fitness")) {
    return "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=700&h=900&fit=crop";
  }

  return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&h=900&fit=crop";
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
