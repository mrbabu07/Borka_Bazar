const makeSvgDataUri = (svg) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const categoryImages = {
  borka: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fb7185"/>
          <stop offset="1" stop-color="#9333ea"/>
        </linearGradient>
        <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="1" stop-color="#4c1d95"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#bg)"/>
      <circle cx="80" cy="54" r="22" fill="#fde7ef"/>
      <path d="M46 139c6-55 16-82 34-82s28 27 34 82H46z" fill="url(#cloth)"/>
      <path d="M59 65c6 14 14 22 21 22s15-8 21-22c-4 35-3 55 4 74H55c7-19 8-39 4-74z" fill="#0f172a" opacity=".8"/>
      <path d="M56 132h48" stroke="#f9a8d4" stroke-width="5" stroke-linecap="round" opacity=".9"/>
    </svg>
  `),
  hijab: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#38bdf8"/>
          <stop offset="1" stop-color="#ec4899"/>
        </linearGradient>
        <linearGradient id="scarf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f472b6"/>
          <stop offset="1" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#bg)"/>
      <path d="M41 83c0-35 17-59 42-59 23 0 39 20 39 49 0 20-7 34-7 55H50c-3-14-9-27-9-45z" fill="url(#scarf)"/>
      <circle cx="81" cy="70" r="25" fill="#ffe4ec"/>
      <path d="M52 88c12 10 26 15 46 14 11-1 18-5 24-12-5 19-4 32-1 47H49c6-16 6-33 3-49z" fill="#be185d" opacity=".8"/>
      <path d="M55 54c16-21 42-25 58-4" fill="none" stroke="#fce7f3" stroke-width="7" stroke-linecap="round" opacity=".9"/>
    </svg>
  `),
  niqab: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#a855f7"/>
          <stop offset="1" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="veil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="1" stop-color="#312e81"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#bg)"/>
      <path d="M45 139c3-61 12-106 35-106s32 45 35 106H45z" fill="url(#veil)"/>
      <rect x="58" y="60" width="44" height="17" rx="8" fill="#fde7ef"/>
      <path d="M60 90h40" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round" opacity=".9"/>
      <path d="M53 45c13-20 40-22 54 0" fill="none" stroke="#c4b5fd" stroke-width="6" stroke-linecap="round" opacity=".85"/>
    </svg>
  `),
};

export function getCategoryImage(categoryName = "") {
  const name = categoryName.toLowerCase();

  if (
    name.includes("borka") ||
    name.includes("burka") ||
    name.includes("abaya")
  ) {
    return categoryImages.borka;
  }

  if (name.includes("hijab") || name.includes("hizab")) {
    return categoryImages.hijab;
  }

  if (
    name.includes("niqab") ||
    name.includes("nikab") ||
    name.includes("nekab")
  ) {
    return categoryImages.niqab;
  }

  return null;
}
