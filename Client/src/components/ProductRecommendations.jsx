import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../services/api";
import { useCurrency } from "../hooks/useCurrency";

export default function ProductRecommendations({ 
  currentProductId, 
  category, 
  title = "You May Also Like",
  limit = 4 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchRecommendations();
  }, [currentProductId, category]);

  const fetchRecommendations = async () => {
    try {
      const response = await getProducts();
      let products = response.data.data || [];

      // Filter out current product
      products = products.filter(p => p._id !== currentProductId);

      // Prioritize same category
      if (category) {
        const sameCategory = products.filter(p => p.category === category);
        const otherProducts = products.filter(p => p.category !== category);
        products = [...sameCategory, ...otherProducts];
      }

      // Shuffle for variety
      products = products.sort(() => Math.random() - 0.5);

      setRecommendations(products.slice(0, limit));
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="font-display text-2xl text-black mb-8">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 mb-4"></div>
              <div className="h-4 bg-gray-200 mb-2"></div>
              <div className="h-4 bg-gray-200 w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="py-12">
      <h2 className="font-display text-2xl text-black mb-8">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <Link
            key={product._id}
            to={`/product/${product._id}`}
            className="group"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
              <img
                src={product.images?.[0] || product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <h3 className="font-medium text-black text-sm mb-1 line-clamp-2">
              {product.title}
            </h3>
            <p className="text-black font-semibold">
              {formatPrice(product.price)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
