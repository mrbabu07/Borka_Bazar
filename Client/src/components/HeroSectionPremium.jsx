import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function HeroSectionPremium() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Elegant Modest Fashion",
      subtitle: "Discover Timeless Elegance",
      description: "Handcrafted burkas that blend tradition with contemporary style",
      image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1920&h=1080&fit=crop",
      cta: { text: "Shop Now", link: "/products" },
    },
    {
      title: "Premium Quality Fabrics",
      subtitle: "Comfort Meets Style",
      description: "Experience luxury with our carefully selected premium fabrics",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=1080&fit=crop",
      cta: { text: "Explore Collection", link: "/products" },
    },
    {
      title: "New Arrivals",
      subtitle: "Latest Collection 2024",
      description: "Be the first to discover our newest designs",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop",
      cta: { text: "View New Arrivals", link: "/products?sort=newest" },
    },
  ];

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  return (
    <section className="relative h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
      {/* Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentSlide
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-2xl">
              {/* Subtitle */}
              <p className="text-gold-500 text-sm md:text-base tracking-[0.3em] uppercase mb-4 animate-fade-in">
                {slide.subtitle}
              </p>

              {/* Title */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white mb-6 leading-tight animate-slide-up">
                {slide.title}
              </h1>

              {/* Description */}
              <p className="text-white/90 text-base md:text-lg lg:text-xl mb-8 max-w-xl leading-relaxed animate-slide-up delay-200">
                {slide.description}
              </p>

              {/* CTA Button */}
              <Link
                to={slide.cta.link}
                className="inline-block px-10 md:px-12 py-4 bg-white text-black text-sm tracking-[0.2em] uppercase font-medium hover:bg-gold-500 hover:text-white transition-all duration-300 animate-slide-up delay-300"
              >
                {slide.cta.text}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {heroSlides.map((_, index) => (
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
            (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
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
          setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
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
