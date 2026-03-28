import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, getCategories } from "../services/api";
import ProductCardPremium from "../components/ProductCardPremium";
import HeroSectionPremium from "../components/HeroSectionPremium";
import { ProductCardSkeleton } from "../components/Skeleton";

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

      const allProducts = productsRes.data.data;
      setProducts(allProducts.slice(0, 8));
      setNewArrivals(allProducts.slice(-4).reverse());
      setCategories(categoriesRes.data.data || []);
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSectionPremium />

      {/* Features Bar */}
      <section className="border-y border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 text-gold-500">
                  {feature.icon}
                </div>
                <h3 className="text-sm tracking-widest uppercase font-medium text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
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
              <h2 className="font-display text-3xl md:text-4xl text-black mb-4">
                Shop by Category
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Discover our curated collections designed for every occasion
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.slice(0, 4).map((category) => (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden"
                >
                  <img
                    src={category.image || "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop"}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <h3 className="font-display text-xl text-white">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-gold-500 text-sm tracking-[0.3em] uppercase mb-3">
              Curated Selection
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-black mb-4">
              Featured Collection
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
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
              className="inline-block px-12 py-4 border-2 border-black text-black text-sm tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-all"
            >
              View All Products
            </Link>
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
              <h2 className="font-display text-3xl md:text-4xl text-black mb-4">
                New Arrivals
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
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

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-gold-500 text-sm tracking-[0.3em] uppercase mb-3">
              Testimonials
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-black mb-4">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Ayesha Rahman",
                comment: "Exceptional quality and elegant designs. The fabric is luxurious and the fit is perfect.",
                rating: 5,
              },
              {
                name: "Fatima Khan",
                comment: "Beautiful collection! The attention to detail is remarkable. Highly recommend.",
                rating: 5,
              },
              {
                name: "Zainab Ahmed",
                comment: "Premium quality burkas at reasonable prices. Fast delivery and excellent customer service.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 text-center">
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-gold-500 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  "{testimonial.comment}"
                </p>
                <p className="font-medium text-black">{testimonial.name}</p>
                <p className="text-sm text-gray-400">Verified Customer</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-gold-500 text-sm tracking-[0.3em] uppercase mb-3">
              Follow Us
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-black mb-4">
              @elegance_fashion
            </h2>
            <p className="text-gray-500">
              Join our community and get inspired
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <a
                key={i}
                href="#"
                className="relative aspect-square overflow-hidden group"
              >
                <img
                  src={`https://images.unsplash.com/photo-${1580000000000 + i * 1000000}?w=600&h=600&fit=crop`}
                  alt={`Instagram post ${i}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
