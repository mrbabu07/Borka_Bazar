import { useEffect, useRef } from "react";
import { auth } from "../firebase/firebase.config";
import { buildApiUrl } from "../utils/apiConfig";

const useProductView = (productId) => {
  const viewedProductIds = useRef(new Set());

  useEffect(() => {
    if (!productId || viewedProductIds.current.has(productId)) return;

    const controller = new AbortController();

    const trackView = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
        };
        const currentUser = auth.currentUser;

        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          buildApiUrl(`/products/${encodeURIComponent(productId)}/view`),
          {
            method: "POST",
            headers,
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        viewedProductIds.current.add(productId);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Failed to track product view:", error);
      }
    };

    // Track view after a short delay to ensure the user actually sees the product
    const timer = setTimeout(trackView, 1000);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [productId]);
};

export default useProductView;
