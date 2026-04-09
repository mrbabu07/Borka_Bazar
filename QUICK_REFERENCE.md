# Borka Bazar - Quick Reference Card

## 🎯 Standardized Categories (8 Total)

| # | Category | Slug | Description |
|---|----------|------|-------------|
| 1 | Classic Borka | classic-borka | Timeless elegance with traditional craftsmanship |
| 2 | Premium Borka | premium-borka | Luxurious designs with premium embellishments |
| 3 | Artisan Borka | artisan-borka | Handcrafted pieces with unique designs |
| 4 | Summer Collection | summer-collection | Lightweight and breathable for warm weather |
| 5 | Modern Abaya | modern-abaya | Contemporary styles with modern silhouettes |
| 6 | Printed Collection | printed-collection | Vibrant prints and patterns |
| 7 | Occasion Wear | occasion-wear | Special designs for celebrations and events |
| 8 | Custom Design | custom-design | Personalized pieces tailored to your preferences |

---

## 🧵 Standardized Fabrics (8 Total)

1. **Aroya Premium** - Luxurious, stone-work ready
2. **Zoom Embroidery** - Embroidery-friendly weave
3. **Dubai Cherry** - Floral print base
4. **Bhabla Blend** - Traditional weave
5. **Jacket Weave** - Structured, crisp finish
6. **Nida Premium** - Lightweight, breathable
7. **Japran Silk** - Soft silk-like texture
8. **Elix Georgette** - Flowing, elegant drape

---

## 📋 Naming Conventions

### ✅ DO's
- Use Title Case: "Classic Borka", "Stone Embellished"
- Keep names short: 2-4 words max
- Use descriptive adjectives: Premium, Luxury, Modern, Classic
- Be specific: "Hand-Embroidered" not "Handwork"

### ❌ DON'Ts
- Don't use abbreviations (except Borka/Abaya)
- Don't mix languages
- Don't use vague terms: "Nice", "Beautiful"
- Don't use location names in main categories

---

## 🔄 Product Naming Examples

### Example 1: Classic Stone Work
```
Category: Classic Borka
Fabric: Aroya Premium
Display Name: Stone Embellished Classic Borka
```

### Example 2: Summer Lightweight
```
Category: Summer Collection
Fabric: Nida Premium
Display Name: Feather Light Summer Borka
```

### Example 3: Wedding Special
```
Category: Occasion Wear
Fabric: Elix Georgette
Display Name: Bridal Elegance - Luxury Occasion Wear
```

---

## 🛠️ Admin Tasks

### Adding a New Product
1. Go to Admin → Products → Add Product
2. Fill in basic info (Title, Price, Stock)
3. Select **Category** from dropdown (8 options)
4. Select **Fabric** from dropdown (8 options)
5. Add sizes, colors, images
6. Save

### Creating a Category
1. Go to Admin → Categories
2. Click "Add Category"
3. Enter name (e.g., "Classic Borka")
4. Slug auto-generates (e.g., "classic-borka")
5. Add description
6. Mark as Active
7. Save

---

## 🔍 Filter Options (Frontend)

### Category Filter
- Classic Borka
- Premium Borka
- Artisan Borka
- Summer Collection
- Modern Abaya
- Printed Collection
- Occasion Wear
- Custom Design

### Fabric Filter
- Aroya Premium
- Zoom Embroidery
- Dubai Cherry
- Bhabla Blend
- Jacket Weave
- Nida Premium
- Japran Silk
- Elix Georgette

### Size Filter
- 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60

### Color Filter
- Black, White, Navy, Maroon, Green, Brown, Gray

---

## 📊 Product Mapping

### Classic Borka Products Should Use:
- Fabrics: Nida, Aroya, Japran
- Styles: Plain, Stone Embellished, Gold Embroidered

### Premium Borka Products Should Use:
- Fabrics: Aroya, Zoom, Elix Georgette
- Styles: Trending, Luxury Embroidered

### Summer Collection Products Should Use:
- Fabrics: Nida Premium, Elix Georgette
- Styles: Feather Light, Soft Touch

### Printed Collection Products Should Use:
- Fabrics: Dubai Cherry, Jacket Weave, Zoom
- Styles: Jacket Pattern, Cherry Blossom, Designer

### Occasion Wear Products Should Use:
- Fabrics: Aroya, Elix Georgette, Zoom
- Styles: Party Perfect, Bridal Elegance, Luxury Occasion

---

## 🚀 Implementation Checklist

- [ ] Update all existing categories
- [ ] Update all existing products with new categories
- [ ] Verify fabric dropdown works in ProductForm
- [ ] Test all filters on frontend
- [ ] Update product descriptions
- [ ] Test on mobile and desktop
- [ ] Verify SEO meta tags
- [ ] Update website navigation
- [ ] Train team on new naming conventions

---

## 📞 Common Questions

**Q: Can I add custom fabrics?**
A: No, use only the 8 standardized fabrics. Contact admin to add new ones.

**Q: Can I rename categories?**
A: No, use the standardized names. This ensures consistency across the platform.

**Q: What if a product fits multiple categories?**
A: Choose the most relevant one. Use product tags for secondary categories.

**Q: How do I filter by multiple options?**
A: Use the filter panel - select category, then fabric, then size, etc.

---

## 📁 Related Files

- `PRODUCT_STANDARDIZATION.md` - Complete standardization guide
- `IMPLEMENTATION_GUIDE.md` - Step-by-step implementation
- `CATEGORIES_SEED_DATA.json` - Category and fabric data
- `Client/src/pages/admin/ProductForm.jsx` - Admin product form
- `Client/src/pages/ProductsPremium.jsx` - Frontend product listing

