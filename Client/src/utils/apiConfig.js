export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function buildApiUrl(path = "") {
  const cleanBase = API_URL.replace(/\/+$/, "");
  const cleanPath = String(path).replace(/^\/+/, "");
  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
}

export function getArrayData(response) {
  return Array.isArray(response?.data?.data) ? response.data.data : [];
}

export function getObjectData(response) {
  const data = response?.data?.data;
  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
}
