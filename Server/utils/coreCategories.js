const CORE_CATEGORIES = [
  {
    name: "Niqab",
    slug: "niqab",
    aliases: ["nikab"],
    description:
      "Face veils and niqab styles designed for comfortable modest coverage.",
    image:
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900&h=1100&fit=crop",
    isActive: true,
    customFields: [
      {
        _id: "niqab-coverage-style",
        fieldName: "Coverage Style",
        fieldType: "dropdown",
        isRequired: false,
        options: ["Single Layer", "Double Layer", "Three Layer"],
      },
      {
        _id: "niqab-fabric",
        fieldName: "Fabric",
        fieldType: "dropdown",
        isRequired: false,
        options: ["Chiffon", "Georgette", "Nida", "Cotton"],
      },
    ],
  },
  {
    name: "Hijab",
    slug: "hijab",
    aliases: ["hijab"],
    description:
      "Hijabs and scarves for everyday wear, occasion styling, and modest fashion.",
    image:
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=900&h=1100&fit=crop",
    isActive: true,
    customFields: [
      {
        _id: "hijab-style",
        fieldName: "Hijab Style",
        fieldType: "dropdown",
        isRequired: false,
        options: ["Plain", "Printed", "Instant", "Crinkle"],
      },
      {
        _id: "hijab-fabric",
        fieldName: "Fabric",
        fieldType: "dropdown",
        isRequired: false,
        options: ["Chiffon", "Jersey", "Georgette", "Cotton"],
      },
    ],
  },
];

function normalizeCategorySlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

module.exports = {
  CORE_CATEGORIES,
  normalizeCategorySlug,
};
