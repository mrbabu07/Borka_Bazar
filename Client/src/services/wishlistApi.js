import axios from "axios";
import { auth } from "../firebase/firebase.config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const wishlistApi = axios.create({
  baseURL: `${API_URL}/wishlist`,
});

// Add auth token to requests
wishlistApi.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Wishlist API functions
export const getWishlist = () => wishlistApi.get("/");
export const addToWishlist = (productId) =>
  wishlistApi.post("/", { productId });
export const removeFromWishlist = (productId) =>
  wishlistApi.delete(`/${productId}`);
export const clearWishlist = () => wishlistApi.delete("/");
