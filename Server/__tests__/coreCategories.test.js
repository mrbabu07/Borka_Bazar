const {
  CORE_CATEGORIES,
  normalizeCategorySlug,
} = require("../utils/coreCategories");

describe("core category workflow", () => {
  test("includes Hijab and Niqab as active seeded categories", () => {
    const slugs = CORE_CATEGORIES.map((category) => category.slug);

    expect(slugs).toEqual(expect.arrayContaining(["hijab", "niqab"]));
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const category of CORE_CATEGORIES) {
      expect(category.name).toBeTruthy();
      expect(category.description).toBeTruthy();
      expect(category.isActive).toBe(true);
      expect(Array.isArray(category.customFields)).toBe(true);
    }
  });

  test("normalizes user-facing category names into route-safe slugs", () => {
    expect(normalizeCategorySlug("  Premium Hijab Collection ")).toBe(
      "premium-hijab-collection",
    );
    expect(normalizeCategorySlug("Nikab / Niqab")).toBe("nikab-niqab");
  });
});
