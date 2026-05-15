import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import useWishlist from "../hooks/useWishlist";
import { getCategories } from "../services/api";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import useSocialLinks from "../hooks/useSocialLinks";
import { getArrayData } from "../utils/apiConfig";

export default function NavbarPremium() {
  const { t } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const socialLinks = useSocialLinks();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(getArrayData(response));
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/products" },
    { name: "Categories", path: "/categories" },
    { name: "About", path: "/about" },
  ];

  return (
    <>
      {/* Top Bar - Minimal & Elegant */}
      <div className="bg-black py-2 text-xs text-white transition-colors duration-300 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <p className="hidden tracking-wide md:block">
              Fast Delivery Across Bangladesh
            </p>
            <Link
              to="/"
              className="min-w-0 flex-1 truncate font-display text-sm font-bold tracking-[0.18em] text-white transition-colors hover:text-gold-400 md:hidden"
            >
              BORKA BAZAR
            </Link>
            <div className="flex shrink-0 items-center gap-3 sm:gap-6">
              <a href="tel:01878305319" className="hidden tracking-wide transition-colors hover:text-gold-500 sm:inline">
                01878305319
              </a>
              <div className="flex items-center gap-3">
                {socialLinks.facebook.enabled && (
                  <button 
                    onClick={() => window.open(socialLinks.facebook.url, "_blank", "noopener,noreferrer")}
                    className="hover:text-gold-500 transition-colors" 
                    title="Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                )}
                {socialLinks.tiktok.enabled && (
                  <button 
                    onClick={() => window.open(socialLinks.tiktok.url, "_blank", "noopener,noreferrer")}
                    className="hover:text-gold-500 transition-colors" 
                    title="TikTok"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.82 2.89 2.89 0 0 1 5.1-1.82V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.96-.1z"/>
                    </svg>
                  </button>
                )}
                {socialLinks.instagram.enabled && (
                  <button
                    onClick={() => window.open(socialLinks.instagram.url, "_blank", "noopener,noreferrer")}
                    className="hover:text-gold-500 transition-colors"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect width="18" height="18" x="3" y="3" rx="5" ry="5" strokeWidth="2" />
                      <circle cx="12" cy="12" r="4" strokeWidth="2" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar - Premium & Clean */}
      <nav
        className={`bg-white dark:bg-gray-900 sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-md border-b border-gray-100 dark:border-gray-800" : "border-b border-gray-100 dark:border-gray-800"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center justify-between gap-2 py-3 sm:h-20 sm:py-0">
            {/* Logo - Elegant Typography */}
            <Link to="/" className="group flex min-w-0 shrink items-center">
              <div className="min-w-0 text-left sm:text-center">
                <h1 className="truncate font-display text-lg font-bold tracking-tight text-black transition-colors group-hover:text-gold-500 dark:text-white sm:text-2xl md:text-3xl">
                  BORKA BAZAR
                </h1>
                <p className="truncate text-[9px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400 sm:text-[10px] sm:tracking-[0.3em]">
                  Modest Fashion
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `text-sm tracking-wide uppercase font-medium transition-colors ${
                      isActive
                        ? "text-black dark:text-white border-b-2 border-gold-500"
                        : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-4">
              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Search Icon - Desktop */}
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="hidden lg:block p-2 text-gray-700 dark:text-gray-300 hover:text-gold-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Wishlist */}
              {user && (
                <div className="hidden min-[380px]:block">
                  <NotificationBell />
                </div>
              )}

              {/* Wishlist */}
              {user && (
                <Link to="/wishlist" className="relative hidden p-2 text-gray-700 transition-colors hover:text-gold-500 dark:text-gray-300 sm:block">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-gold-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Account */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-2 text-gray-700 dark:text-gray-300 hover:text-gold-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-black dark:text-white">
                          {user.displayName || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">My Profile</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">My Orders</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="text-sm text-gold-600 dark:text-gold-400 font-medium">Admin Dashboard</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <span className="text-sm text-red-600 dark:text-red-400">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden lg:block px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-sm tracking-wide uppercase font-medium hover:bg-gold-500 dark:hover:bg-gold-500 dark:hover:text-black transition-colors"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 lg:hidden"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
            <SearchBar
              placeholder="Search for modest fashion..."
              onSearch={handleSearch}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-900 transition-colors focus:border-black focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-white"
              showSuggestions={true}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white py-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
            <div className="space-y-1 px-4">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  {user && <NotificationBell />}
                </div>
                <div className="flex items-center gap-2">
                  {user && (
                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="relative rounded-lg p-2 text-gray-700 transition-colors hover:bg-white hover:text-gold-500 dark:text-gray-300 dark:hover:bg-gray-900"
                      title="Wishlist"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {wishlistCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white dark:bg-white dark:text-black">
                          {wishlistCount > 9 ? "9+" : wishlistCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <a
                    href="tel:01878305319"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    Call
                  </a>
                </div>
              </div>
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-3 text-sm font-medium uppercase tracking-wide transition-colors ${
                      isActive
                        ? "bg-gray-100 text-black dark:bg-gray-800 dark:text-white"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-sm tracking-wide uppercase font-medium text-gold-600"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Desktop Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 lg:block hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSearchOpen(false)}
          />
          <div className="absolute top-0 left-0 right-0 bg-white shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center gap-4">
                <SearchBar
                  placeholder="Search for modest fashion..."
                  onSearch={(query) => {
                    handleSearch(query);
                    setSearchOpen(false);
                  }}
                  className="flex-1 h-14 px-6 pr-14 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors text-lg"
                  showSuggestions={true}
                  autoFocus={true}
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-3 hover:bg-gray-100 transition-colors rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
