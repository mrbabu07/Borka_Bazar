import { useEffect, useMemo, useState } from "react";
import { socialLinks as fallbackSocialLinks } from "../config/socialLinks";
import { getSocialSettings } from "../services/api";

const platformNames = {
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
};

export default function useSocialLinks() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchSocialSettings() {
      try {
        const response = await getSocialSettings();
        if (!ignore && response.data?.success) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch social links:", error);
      }
    }

    fetchSocialSettings();

    return () => {
      ignore = true;
    };
  }, []);

  return useMemo(() => {
    const merged = { ...fallbackSocialLinks };

    for (const key of Object.keys(platformNames)) {
      const fallback = fallbackSocialLinks[key] || {};
      const platform = settings?.[key] || {};
      merged[key] = {
        ...fallback,
        name: fallback.name || platformNames[key],
        url: platform.url || fallback.url || "",
        enabled: platform.enabled !== false && Boolean(platform.url || fallback.url),
      };
    }

    return merged;
  }, [settings]);
}
