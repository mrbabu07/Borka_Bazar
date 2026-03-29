import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function SEO({ 
  title, 
  description, 
  keywords, 
  image, 
  type = "website",
  author = "Borka Bazar"
}) {
  const location = useLocation();
  const siteUrl = window.location.origin;
  const currentUrl = `${siteUrl}${location.pathname}`;

  const defaultTitle = "Borka Bazar - Elegant Modest Fashion";
  const defaultDescription = "Discover elegant and modest fashion at Borka Bazar. Shop premium quality burkas, abayas, and hijabs with free delivery across Bangladesh.";
  const defaultKeywords = "burka, abaya, hijab, modest fashion, islamic clothing, bangladesh, online shopping";
  const defaultImage = `${siteUrl}/og-image.jpg`;

  const metaTitle = title ? `${title} | Borka Bazar` : defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image || defaultImage;

  useEffect(() => {
    // Update document title
    document.title = metaTitle;

    // Update or create meta tags
    updateMetaTag("description", metaDescription);
    updateMetaTag("keywords", metaKeywords);
    updateMetaTag("author", author);

    // Open Graph tags
    updateMetaTag("og:title", metaTitle, "property");
    updateMetaTag("og:description", metaDescription, "property");
    updateMetaTag("og:image", metaImage, "property");
    updateMetaTag("og:url", currentUrl, "property");
    updateMetaTag("og:type", type, "property");
    updateMetaTag("og:site_name", "Borka Bazar", "property");

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image", "name");
    updateMetaTag("twitter:title", metaTitle, "name");
    updateMetaTag("twitter:description", metaDescription, "name");
    updateMetaTag("twitter:image", metaImage, "name");

    // Canonical URL
    updateCanonicalLink(currentUrl);
  }, [metaTitle, metaDescription, metaKeywords, metaImage, currentUrl, type, author]);

  const updateMetaTag = (name, content, attribute = "name") => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`);
    
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    
    element.setAttribute("content", content);
  };

  const updateCanonicalLink = (url) => {
    let link = document.querySelector('link[rel="canonical"]');
    
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    
    link.setAttribute("href", url);
  };

  return null; // This component doesn't render anything
}
