require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = "Borka_Bazar";

// Sample Burka products with realistic data
const burkaProducts = [
  {
    title: "Premium Nida Overhead Burka - Black",
    price: 2499,
    originalPrice: 3499,
    description: "Elegant overhead style burka made from premium Nida fabric. Perfect for daily wear with comfortable fit and breathable material.",
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop"
    ],
    categoryId: null, // Will be set dynamically
    fabric: "Nida",
    style: "Overhead",
    occasion: "Daily Wear",
    sleeveType: "Full Sleeve",
    color: "Black",
    availableSizes: [
      { size: "M", stock: 25 },
      { size: "L", stock: 30 },
      { size: "XL", stock: 20 },
      { size: "XXL", stock: 15 }
    ],
    stock: 90,
    featured: true,
    isActive: true,
    views: 0
  },
  {
    title: "Georgette Front Open Burka - Navy Blue",
    price: 3299,
    originalPrice: 4299,
    description: "Luxurious georgette fabric with front open design. Ideal for formal occasions with elegant draping and premium finish.",
    image: "https://i.ibb.co/KqPQm5Y/burka-navy-1.jpg",
    images: [
      "https://i.ibb.co/KqPQm5Y/burka-navy-1.jpg",
      "https://i.ibb.co/2kXvYnM/burka-navy-2.jpg"
    ],
    categoryId: null,
    fabric: "Georgette",
    style: "Front Open",
    occasion: "Formal",
    sleeveType: "Full Sleeve",
    color: "Navy Blue",
    availableSizes: [
      { size: "S", stock: 15 },
      { size: "M", stock: 20 },
      { size: "L", stock: 25 },
      { size: "XL", stock: 18 }
    ],
    stock: 78,
    featured: true,
    isActive: true,
    views: 0
  },
  {
    title: "Crepe Pullover Burka - Maroon",
    price: 2799,
    originalPrice: 3599,
    description: "Soft crepe fabric pullover style burka. Comfortable for all-day wear with easy maintenance and wrinkle-resistant material.",
    image: "https://i.ibb.co/vXqYnKM/burka-maroon-1.jpg",
    images: [
      "https://i.ibb.co/vXqYnKM/burka-maroon-1.jpg",
      "https://i.ibb.co/8XqYnKM/burka-maroon-2.jpg"
    ],
    categoryId: null,
    fabric: "Crepe",
    style: "Pullover",
    occasion: "Casual",
    sleeveType: "Full Sleeve",
    color: "Maroon",
    availableSizes: [
      { size: "M", stock: 22 },
      { size: "L", stock: 28 },
      { size: "XL", stock: 20 }
    ],
    stock: 70,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Chiffon Two Piece Burka - Beige",
    price: 3599,
    originalPrice: 4799,
    description: "Elegant two-piece chiffon burka set. Perfect for parties and special occasions with flowing fabric and sophisticated design.",
    image: "https://i.ibb.co/9ZQY8Kp/burka-beige-1.jpg",
    images: [
      "https://i.ibb.co/9ZQY8Kp/burka-beige-1.jpg",
      "https://i.ibb.co/7XqYnKM/burka-beige-2.jpg"
    ],
    categoryId: null,
    fabric: "Chiffon",
    style: "Two Piece",
    occasion: "Party",
    sleeveType: "Full Sleeve",
    color: "Beige",
    availableSizes: [
      { size: "S", stock: 12 },
      { size: "M", stock: 18 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 10 }
    ],
    stock: 55,
    featured: true,
    isActive: true,
    views: 0
  },
  {
    title: "Jersey Overhead Burka - Dark Grey",
    price: 2199,
    originalPrice: 2999,
    description: "Comfortable jersey fabric overhead burka. Stretchable and breathable, perfect for daily activities and prayer.",
    image: "https://i.ibb.co/KqPQm5Y/burka-grey-1.jpg",
    images: [
      "https://i.ibb.co/KqPQm5Y/burka-grey-1.jpg",
      "https://i.ibb.co/2kXvYnM/burka-grey-2.jpg"
    ],
    categoryId: null,
    fabric: "Jersey",
    style: "Overhead",
    occasion: "Prayer",
    sleeveType: "Full Sleeve",
    color: "Dark Grey",
    availableSizes: [
      { size: "M", stock: 30 },
      { size: "L", stock: 35 },
      { size: "XL", stock: 25 },
      { size: "XXL", stock: 20 }
    ],
    stock: 110,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Nida Front Open Burka - Brown",
    price: 2699,
    originalPrice: 3499,
    description: "Classic brown nida burka with front open style. Versatile design suitable for both casual and formal settings.",
    image: "https://i.ibb.co/vXqYnKM/burka-brown-1.jpg",
    images: [
      "https://i.ibb.co/vXqYnKM/burka-brown-1.jpg",
      "https://i.ibb.co/8XqYnKM/burka-brown-2.jpg"
    ],
    categoryId: null,
    fabric: "Nida",
    style: "Front Open",
    occasion: "Casual",
    sleeveType: "Full Sleeve",
    color: "Brown",
    availableSizes: [
      { size: "S", stock: 18 },
      { size: "M", stock: 25 },
      { size: "L", stock: 22 },
      { size: "XL", stock: 15 }
    ],
    stock: 80,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Georgette Overhead Burka - Emerald Green",
    price: 3199,
    originalPrice: 4199,
    description: "Stunning emerald green georgette burka. Luxurious feel with elegant draping, perfect for special occasions.",
    image: "https://i.ibb.co/9ZQY8Kp/burka-green-1.jpg",
    images: [
      "https://i.ibb.co/9ZQY8Kp/burka-green-1.jpg",
      "https://i.ibb.co/7XqYnKM/burka-green-2.jpg"
    ],
    categoryId: null,
    fabric: "Georgette",
    style: "Overhead",
    occasion: "Party",
    sleeveType: "Full Sleeve",
    color: "Emerald Green",
    availableSizes: [
      { size: "M", stock: 15 },
      { size: "L", stock: 20 },
      { size: "XL", stock: 12 }
    ],
    stock: 47,
    featured: true,
    isActive: true,
    views: 0
  },
  {
    title: "Crepe Two Piece Burka - Charcoal",
    price: 3399,
    originalPrice: 4299,
    description: "Modern two-piece crepe burka in charcoal shade. Sophisticated design with comfortable fit for all-day wear.",
    image: "https://i.ibb.co/KqPQm5Y/burka-charcoal-1.jpg",
    images: [
      "https://i.ibb.co/KqPQm5Y/burka-charcoal-1.jpg",
      "https://i.ibb.co/2kXvYnM/burka-charcoal-2.jpg"
    ],
    categoryId: null,
    fabric: "Crepe",
    style: "Two Piece",
    occasion: "Formal",
    sleeveType: "Full Sleeve",
    color: "Charcoal",
    availableSizes: [
      { size: "S", stock: 10 },
      { size: "M", stock: 16 },
      { size: "L", stock: 18 },
      { size: "XL", stock: 14 }
    ],
    stock: 58,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Nida Pullover Burka - Burgundy",
    price: 2599,
    originalPrice: 3399,
    description: "Rich burgundy nida pullover burka. Easy to wear with elegant appearance, suitable for daily and formal occasions.",
    image: "https://i.ibb.co/vXqYnKM/burka-burgundy-1.jpg",
    images: [
      "https://i.ibb.co/vXqYnKM/burka-burgundy-1.jpg",
      "https://i.ibb.co/8XqYnKM/burka-burgundy-2.jpg"
    ],
    categoryId: null,
    fabric: "Nida",
    style: "Pullover",
    occasion: "Daily Wear",
    sleeveType: "Full Sleeve",
    color: "Burgundy",
    availableSizes: [
      { size: "M", stock: 20 },
      { size: "L", stock: 25 },
      { size: "XL", stock: 18 },
      { size: "XXL", stock: 12 }
    ],
    stock: 75,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Chiffon Front Open Burka - Lavender",
    price: 3499,
    originalPrice: 4599,
    description: "Delicate lavender chiffon burka with front open design. Perfect for weddings and special celebrations.",
    image: "https://i.ibb.co/9ZQY8Kp/burka-lavender-1.jpg",
    images: [
      "https://i.ibb.co/9ZQY8Kp/burka-lavender-1.jpg",
      "https://i.ibb.co/7XqYnKM/burka-lavender-2.jpg"
    ],
    categoryId: null,
    fabric: "Chiffon",
    style: "Front Open",
    occasion: "Party",
    sleeveType: "Full Sleeve",
    color: "Lavender",
    availableSizes: [
      { size: "S", stock: 8 },
      { size: "M", stock: 12 },
      { size: "L", stock: 10 },
      { size: "XL", stock: 8 }
    ],
    stock: 38,
    featured: true,
    isActive: true,
    views: 0
  },
  {
    title: "Jersey Pullover Burka - Black",
    price: 2299,
    originalPrice: 2999,
    description: "Classic black jersey pullover burka. Stretchable, comfortable, and perfect for prayer and daily activities.",
    image: "https://i.ibb.co/KqPQm5Y/burka-black-jersey-1.jpg",
    images: [
      "https://i.ibb.co/KqPQm5Y/burka-black-jersey-1.jpg",
      "https://i.ibb.co/2kXvYnM/burka-black-jersey-2.jpg"
    ],
    categoryId: null,
    fabric: "Jersey",
    style: "Pullover",
    occasion: "Prayer",
    sleeveType: "Full Sleeve",
    color: "Black",
    availableSizes: [
      { size: "M", stock: 28 },
      { size: "L", stock: 32 },
      { size: "XL", stock: 24 },
      { size: "XXL", stock: 18 }
    ],
    stock: 102,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Georgette Two Piece Burka - Royal Blue",
    price: 3799,
    originalPrice: 4899,
    description: "Luxurious royal blue georgette two-piece set. Premium quality with elegant design for special occasions.",
    image: "https://i.ibb.co/vXqYnKM/burka-royal-blue-1.jpg",
    images: [
      "https://i.ibb.co/vXqYnKM/burka-royal-blue-1.jpg",
      "https://i.ibb.co/8XqYnKM/burka-royal-blue-2.jpg"
    ],
    categoryId: null,
    fabric: "Georgette",
    style: "Two Piece",
    occasion: "Formal",
    sleeveType: "Full Sleeve",
    color: "Royal Blue",
    availableSizes: [
      { size: "S", stock: 10 },
      { size: "M", stock: 15 },
      { size: "L", stock: 12 },
      { size: "XL", stock: 8 }
    ],
    stock: 45,
    featured: true,
    isActive: true,
    views: 0
  },
  {
    title: "Crepe Overhead Burka - Olive Green",
    price: 2899,
    originalPrice: 3699,
    description: "Trendy olive green crepe overhead burka. Modern color with traditional style, perfect for casual outings.",
    image: "https://i.ibb.co/9ZQY8Kp/burka-olive-1.jpg",
    images: [
      "https://i.ibb.co/9ZQY8Kp/burka-olive-1.jpg",
      "https://i.ibb.co/7XqYnKM/burka-olive-2.jpg"
    ],
    categoryId: null,
    fabric: "Crepe",
    style: "Overhead",
    occasion: "Casual",
    sleeveType: "Full Sleeve",
    color: "Olive Green",
    availableSizes: [
      { size: "M", stock: 18 },
      { size: "L", stock: 22 },
      { size: "XL", stock: 16 }
    ],
    stock: 56,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Nida Two Piece Burka - Dusty Pink",
    price: 3299,
    originalPrice: 4199,
    description: "Elegant dusty pink nida two-piece burka. Soft color with comfortable fabric, ideal for parties and gatherings.",
    image: "https://i.ibb.co/KqPQm5Y/burka-pink-1.jpg",
    images: [
      "https://i.ibb.co/KqPQm5Y/burka-pink-1.jpg",
      "https://i.ibb.co/2kXvYnM/burka-pink-2.jpg"
    ],
    categoryId: null,
    fabric: "Nida",
    style: "Two Piece",
    occasion: "Party",
    sleeveType: "Full Sleeve",
    color: "Dusty Pink",
    availableSizes: [
      { size: "S", stock: 12 },
      { size: "M", stock: 18 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 10 }
    ],
    stock: 55,
    featured: true,
    isActive: true,
    views: 0
  },
  {
    title: "Chiffon Overhead Burka - Peach",
    price: 3399,
    originalPrice: 4399,
    description: "Soft peach chiffon overhead burka. Lightweight and elegant, perfect for summer occasions and events.",
    image: "https://i.ibb.co/vXqYnKM/burka-peach-1.jpg",
    images: [
      "https://i.ibb.co/vXqYnKM/burka-peach-1.jpg",
      "https://i.ibb.co/8XqYnKM/burka-peach-2.jpg"
    ],
    categoryId: null,
    fabric: "Chiffon",
    style: "Overhead",
    occasion: "Party",
    sleeveType: "Full Sleeve",
    color: "Peach",
    availableSizes: [
      { size: "M", stock: 14 },
      { size: "L", stock: 18 },
      { size: "XL", stock: 12 }
    ],
    stock: 44,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Jersey Front Open Burka - Navy Blue",
    price: 2399,
    originalPrice: 3199,
    description: "Comfortable navy blue jersey burka with front open design. Stretchable fabric for easy movement and all-day comfort.",
    image: "https://i.ibb.co/9ZQY8Kp/burka-navy-jersey-1.jpg",
    images: [
      "https://i.ibb.co/9ZQY8Kp/burka-navy-jersey-1.jpg",
      "https://i.ibb.co/7XqYnKM/burka-navy-jersey-2.jpg"
    ],
    categoryId: null,
    fabric: "Jersey",
    style: "Front Open",
    occasion: "Daily Wear",
    sleeveType: "Full Sleeve",
    color: "Navy Blue",
    availableSizes: [
      { size: "M", stock: 24 },
      { size: "L", stock: 28 },
      { size: "XL", stock: 20 },
      { size: "XXL", stock: 16 }
    ],
    stock: 88,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Georgette Pullover Burka - Wine Red",
    price: 3099,
    originalPrice: 3999,
    description: "Rich wine red georgette pullover burka. Luxurious fabric with elegant color, suitable for formal events.",
    image: "https://i.ibb.co/KqPQm5Y/burka-wine-1.jpg",
    images: [
      "https://i.ibb.co/KqPQm5Y/burka-wine-1.jpg",
      "https://i.ibb.co/2kXvYnM/burka-wine-2.jpg"
    ],
    categoryId: null,
    fabric: "Georgette",
    style: "Pullover",
    occasion: "Formal",
    sleeveType: "Full Sleeve",
    color: "Wine Red",
    availableSizes: [
      { size: "S", stock: 14 },
      { size: "M", stock: 20 },
      { size: "L", stock: 18 },
      { size: "XL", stock: 12 }
    ],
    stock: 64,
    featured: true,
    isActive: true,
    views: 0
  },
  {
    title: "Crepe Front Open Burka - Teal",
    price: 2999,
    originalPrice: 3799,
    description: "Beautiful teal crepe burka with front open style. Vibrant color with comfortable fabric for casual wear.",
    image: "https://i.ibb.co/vXqYnKM/burka-teal-1.jpg",
    images: [
      "https://i.ibb.co/vXqYnKM/burka-teal-1.jpg",
      "https://i.ibb.co/8XqYnKM/burka-teal-2.jpg"
    ],
    categoryId: null,
    fabric: "Crepe",
    style: "Front Open",
    occasion: "Casual",
    sleeveType: "Full Sleeve",
    color: "Teal",
    availableSizes: [
      { size: "M", stock: 16 },
      { size: "L", stock: 20 },
      { size: "XL", stock: 14 }
    ],
    stock: 50,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Nida Overhead Burka - Mustard",
    price: 2699,
    originalPrice: 3499,
    description: "Trendy mustard nida overhead burka. Unique color with premium fabric, perfect for making a style statement.",
    image: "https://i.ibb.co/9ZQY8Kp/burka-mustard-1.jpg",
    images: [
      "https://i.ibb.co/9ZQY8Kp/burka-mustard-1.jpg",
      "https://i.ibb.co/7XqYnKM/burka-mustard-2.jpg"
    ],
    categoryId: null,
    fabric: "Nida",
    style: "Overhead",
    occasion: "Casual",
    sleeveType: "Full Sleeve",
    color: "Mustard",
    availableSizes: [
      { size: "M", stock: 18 },
      { size: "L", stock: 22 },
      { size: "XL", stock: 16 },
      { size: "XXL", stock: 12 }
    ],
    stock: 68,
    featured: false,
    isActive: true,
    views: 0
  },
  {
    title: "Chiffon Pullover Burka - Mint Green",
    price: 3299,
    originalPrice: 4299,
    description: "Refreshing mint green chiffon pullover burka. Light and airy fabric perfect for summer parties and celebrations.",
    image: "https://i.ibb.co/KqPQm5Y/burka-mint-1.jpg",
    images: [
      "https://i.ibb.co/KqPQm5Y/burka-mint-1.jpg",
      "https://i.ibb.co/2kXvYnM/burka-mint-2.jpg"
    ],
    categoryId: null,
    fabric: "Chiffon",
    style: "Pullover",
    occasion: "Party",
    sleeveType: "Full Sleeve",
    color: "Mint Green",
    availableSizes: [
      { size: "S", stock: 10 },
      { size: "M", stock: 15 },
      { size: "L", stock: 12 },
      { size: "XL", stock: 8 }
    ],
    stock: 45,
    featured: true,
    isActive: true,
    views: 0
  }
];

async function addBurkaProducts() {
  const client = new MongoClient(uri);

  try {
    console.log("🔌 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");

    // Find or create "Burka" category
    console.log("\n📁 Finding/Creating Burka category...");
    let burkaCategory = await categoriesCollection.findOne({ name: "Burka" });
    
    if (!burkaCategory) {
      const categoryResult = await categoriesCollection.insertOne({
        name: "Burka",
        slug: "burka",
        description: "Premium quality Burkas in various styles and fabrics",
        image: "https://i.ibb.co/9ZQY8Kp/category-burka.jpg",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      burkaCategory = { _id: categoryResult.insertedId, name: "Burka" };
      console.log("✅ Created Burka category");
    } else {
      console.log("✅ Found existing Burka category");
    }

    // Add categoryId to all products
    const productsToInsert = burkaProducts.map(product => ({
      ...product,
      categoryId: burkaCategory._id.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert products
    console.log("\n📦 Inserting 20 Burka products...");
    const result = await productsCollection.insertMany(productsToInsert);
    
    console.log(`\n✅ Successfully added ${result.insertedCount} products!`);
    console.log("\n📊 Product Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Count by fabric
    const fabricCounts = {};
    const styleCounts = {};
    const occasionCounts = {};
    
    productsToInsert.forEach(p => {
      fabricCounts[p.fabric] = (fabricCounts[p.fabric] || 0) + 1;
      styleCounts[p.style] = (styleCounts[p.style] || 0) + 1;
      occasionCounts[p.occasion] = (occasionCounts[p.occasion] || 0) + 1;
    });
    
    console.log("\n🧵 By Fabric:");
    Object.entries(fabricCounts).forEach(([fabric, count]) => {
      console.log(`   ${fabric}: ${count} products`);
    });
    
    console.log("\n👗 By Style:");
    Object.entries(styleCounts).forEach(([style, count]) => {
      console.log(`   ${style}: ${count} products`);
    });
    
    console.log("\n🎉 By Occasion:");
    Object.entries(occasionCounts).forEach(([occasion, count]) => {
      console.log(`   ${occasion}: ${count} products`);
    });
    
    console.log("\n💰 Price Range:");
    const prices = productsToInsert.map(p => p.price);
    console.log(`   Min: ৳${Math.min(...prices)}`);
    console.log(`   Max: ৳${Math.max(...prices)}`);
    console.log(`   Avg: ৳${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)}`);
    
    console.log("\n📦 Total Stock:");
    const totalStock = productsToInsert.reduce((sum, p) => sum + p.stock, 0);
    console.log(`   ${totalStock} units across all products`);
    
    console.log("\n⭐ Featured Products:");
    const featuredCount = productsToInsert.filter(p => p.featured).length;
    console.log(`   ${featuredCount} products marked as featured`);
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🎊 All products added successfully!");
    console.log("🌐 You can now view them in your admin panel or products page");
    
  } catch (error) {
    console.error("\n❌ Error adding products:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
addBurkaProducts()
  .then(() => {
    console.log("\n✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
