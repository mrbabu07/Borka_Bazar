import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Dumbbell,
  Grid3X3,
  Home,
  PackageSearch,
  Palette,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { API_URL, getArrayData } from "../utils/apiConfig";
import { getCategoryImage } from "../utils/categoryVisuals";

export default function CategoryCarousel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(getArrayData(response));
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (categoryName) => {
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
  };

  if (loading) {
    return (
      <section className="bg-gray-50 py-10 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-6 h-8 w-56 rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-lg bg-white dark:bg-gray-800"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-gray-100 bg-gray-50 py-10 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
              <Grid3X3 className="h-4 w-4" />
              Collections
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white md:text-3xl">
              Shop by Category
            </h2>
          </div>

          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-rose-600 hover:text-white dark:bg-gray-900 dark:text-rose-300 dark:ring-gray-800 dark:hover:bg-rose-600 dark:hover:text-white"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
          {categories.map((category) => {
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
  );
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
    };
  }

  if (name.includes("baby") || name.includes("kid") || name.includes("child")) {
    return {
      card: "border-amber-100 bg-gradient-to-br from-white via-amber-50 to-orange-50 hover:border-amber-200 dark:border-amber-900/40 dark:from-gray-900 dark:via-amber-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-amber-400 to-orange-500",
    };
  }

  if (name.includes("home") || name.includes("furniture")) {
    return {
      card: "border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-teal-50 hover:border-emerald-200 dark:border-emerald-900/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-emerald-500 to-teal-600",
    };
  }

  if (name.includes("sport") || name.includes("fitness")) {
    return {
      card: "border-lime-100 bg-gradient-to-br from-white via-lime-50 to-green-50 hover:border-lime-200 dark:border-lime-900/40 dark:from-gray-900 dark:via-lime-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-lime-500 to-green-600",
    };
  }

  if (name.includes("book") || name.includes("education")) {
    return {
      card: "border-violet-100 bg-gradient-to-br from-white via-violet-50 to-purple-50 hover:border-violet-200 dark:border-violet-900/40 dark:from-gray-900 dark:via-violet-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-violet-500 to-purple-600",
    };
  }

  if (name.includes("men") || name.includes("man")) {
    return {
      card: "border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-slate-50 hover:border-indigo-200 dark:border-indigo-900/40 dark:from-gray-900 dark:via-indigo-950/20 dark:to-gray-900",
      icon: "bg-gradient-to-br from-indigo-500 to-slate-700",
    };
  }

  return {
    card: "border-orange-100 bg-gradient-to-br from-white via-orange-50 to-yellow-50 hover:border-orange-200 dark:border-orange-900/40 dark:from-gray-900 dark:via-orange-950/20 dark:to-gray-900",
    icon: "bg-gradient-to-br from-orange-500 to-red-500",
  };
}
