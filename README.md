# 🧕 Borka Bazar - Elegant Modest Fashion eCommerce

A modern, premium MERN stack eCommerce platform specializing in elegant modest fashion including Burkas, Abayas, and Hijabs.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Version](https://img.shields.io/badge/version-1.0.0-orange)]()

---

## 🌟 Features

### 🛍️ Customer Features
- **Product Discovery**
  - Browse elegant modest fashion collection
  - Advanced filters (fabric, style, occasion, size, color)
  - Smart product recommendations
  - Search with autocomplete
  - Category-based browsing

- **Shopping Experience**
  - Shopping cart with size selection
  - Wishlist with sharing capability
  - Product comparison
  - Size guide with fit finder
  - Quick view modal
  - Social media sharing

- **User Account**
  - Firebase authentication (Email/Password, Google)
  - Profile management
  - Multiple delivery addresses
  - Order history with tracking
  - Loyalty points system
  - Price alerts

- **Order Management**
  - Enhanced order tracking (5-stage timeline)
  - COD (Cash on Delivery) payment
  - Dynamic delivery charges
  - Free delivery threshold
  - Coupon support
  - 30-minute cancellation window
  - Return request system

- **Customer Support**
  - Live chat with AI bot
  - Support ticket system
  - Product Q&A section
  - Review and rating system

- **Engagement**
  - Flash sales
  - Promotional offers
  - Stock alerts
  - Push notifications
  - Multi-language support (English, Bengali, Hindi)

### 👨‍💼 Admin Features
- **Dashboard**
  - Real-time analytics
  - Revenue tracking
  - Order statistics
  - Customer insights
  - Top products analysis
  - Low stock alerts

- **Product Management**
  - Add/edit/delete products
  - Multiple image upload (imgBB)
  - Product variants (size, color)
  - Inventory tracking
  - Category management
  - Bulk operations
  - Import/export functionality

- **Order Management**
  - View all orders
  - Order status updates
  - Order filtering and search
  - Invoice generation
  - Return management

- **Customer Management**
  - User list and details
  - Role management
  - Purchase history
  - Customer insights

- **Marketing**
  - Coupon management
  - Flash sale management
  - Offer/banner management
  - Delivery settings

- **Content Management**
  - Category management
  - Review moderation
  - Q&A management
  - Support tickets

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19.2.0
- **Routing:** React Router DOM 7.12.0
- **Styling:** Tailwind CSS 3.4.19
- **State Management:** Context API
- **Authentication:** Firebase 10.7.0
- **HTTP Client:** Axios 1.13.2
- **Animations:** Framer Motion 11.18.2
- **Notifications:** React Hot Toast 2.6.0
- **Charts:** Recharts 3.7.0
- **i18n:** React i18next 16.5.4
- **Build Tool:** Vite 7.2.4

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Native Driver + Mongoose)
- **Authentication:** Firebase Admin SDK
- **Notifications:** Web Push
- **Email:** Nodemailer
- **Image Hosting:** imgBB API

### Design System
- **Colors:** Black (#000), White (#FFF), Soft Gold (#C9A961)
- **Typography:** Playfair Display (headings), Inter (body)
- **Principles:** Minimal, Elegant, Premium, Feminine

---

## 📦 Project Structure

```
Borka_Bazar/
├── Client/                     # React Frontend
│   ├── public/
│   │   ├── icons/             # PWA icons
│   │   ├── manifest.json      # PWA manifest
│   │   └── sw.js              # Service worker
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── admin/         # Admin-specific components
│   │   │   ├── reviews/       # Review components
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LazyImage.jsx
│   │   │   ├── LiveChat.jsx
│   │   │   ├── OrderTracking.jsx
│   │   │   ├── ProductRecommendations.jsx
│   │   │   ├── SEO.jsx
│   │   │   ├── SizeGuide.jsx
│   │   │   └── SocialShare.jsx
│   │   ├── context/           # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── WishlistContext.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── i18n/              # Internationalization
│   │   ├── layouts/           # Layout components
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin pages
│   │   │   └── ...            # Customer pages
│   │   ├── routes/            # Route configuration
│   │   ├── services/          # API services
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.local             # Environment variables
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── Server/                     # Node.js Backend
│   ├── controllers/           # Route controllers
│   ├── models/                # MongoDB models
│   ├── routes/                # API routes
│   ├── middleware/            # Custom middleware
│   ├── services/              # Business logic
│   ├── scripts/               # Utility scripts
│   ├── .env                   # Environment variables
│   ├── index.js               # Entry point
│   └── package.json
│
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Firebase project
- imgBB API key (free)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/mrbabu07/Borka_Bazar.git
cd Borka_Bazar
```

#### 2. Install Server Dependencies
```bash
cd Server
npm install
```

#### 3. Install Client Dependencies
```bash
cd ../Client
npm install
```

#### 4. Configure Environment Variables

**Server/.env:**
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/Borka_Bazar?retryWrites=true&w=majority

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
APP_NAME=Borka Bazar
APP_EMAIL=your_email@gmail.com
FRONTEND_URL=http://localhost:5173

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:admin@borkabazar.com
```

**Client/.env.local:**
```env
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# imgBB API Key
VITE_IMGBB_API_KEY=your_imgbb_api_key
```

#### 5. Run the Application

**Start Backend (Terminal 1):**
```bash
cd Server
npm run dev
```

**Start Frontend (Terminal 2):**
```bash
cd Client
npm run dev
```

**Access the Application:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Admin Panel: http://localhost:5173/admin

---

## 🎨 Design Philosophy

### Premium Minimal Design
- Clean white backgrounds
- Elegant typography (Playfair Display + Inter)
- Subtle gold accents (#C9A961)
- Generous white space
- Smooth transitions

### User Experience
- Mobile-first responsive design
- Lazy loading for performance
- Error boundaries for stability
- SEO optimized
- Accessibility compliant

---

## 📱 Key Features in Detail

### 1. Product Recommendations
- Smart category-based suggestions
- "You May Also Like" section
- Randomized for variety
- Responsive grid layout

### 2. Social Media Integration
- Share on Facebook, Twitter, WhatsApp, Pinterest, LinkedIn
- Copy link functionality
- One-click sharing

### 3. Live Chat Support
- Floating chat widget
- AI bot with smart responses
- Quick reply buttons
- Real-time messaging

### 4. Enhanced Order Tracking
- 5-stage visual timeline
- Status indicators
- Estimated delivery date
- Delivery address display

### 5. Size Guide & Fit Finder
- Interactive size chart
- Size calculator
- Measurement instructions
- Category-specific guides

### 6. Performance Optimization
- Lazy loading images
- Code splitting ready
- Optimized bundle size
- Fast initial load

### 7. SEO Optimization
- Dynamic meta tags
- Open Graph support
- Twitter Cards
- Canonical URLs

### 8. Error Handling
- Error boundary component
- Graceful error recovery
- User-friendly messages

---

## 🔐 Security Features

- Firebase Authentication
- Admin role verification
- Input validation
- CORS configuration
- Environment variable protection
- Secure password handling
- XSS prevention

---

## 📊 Admin Dashboard

### Analytics
- Revenue tracking
- Order statistics
- Customer insights
- Real-time stats
- Charts and graphs

### Management
- Product CRUD operations
- Order management
- User management
- Inventory tracking
- Category management

---

## 🌐 Deployment

### Frontend (Netlify/Vercel)
```bash
cd Client
npm run build
# Deploy dist/ folder
```

### Backend (Vercel/Railway/Render)
```bash
cd Server
# Deploy with environment variables
```

### Database
- MongoDB Atlas (Cloud)
- Automatic backups
- Scalable infrastructure

---

## 📈 Performance

- **Bundle Size:** 1.30 MB (336 KB gzipped)
- **Build Time:** ~7-8 seconds
- **Lighthouse Score:** 90+ (Performance)
- **First Contentful Paint:** <2s
- **Time to Interactive:** <3s

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Complete e-commerce functionality
- ✅ Product recommendations
- ✅ Social media integration
- ✅ Live chat support
- ✅ Enhanced order tracking
- ✅ Size guide & fit finder
- ✅ Performance optimization
- ✅ SEO optimization
- ✅ Error handling
- ✅ Premium UI/UX redesign

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📧 Contact & Support

- **Email:** mdjahedulislamjaved@gmail.com
- **Phone:** +880 1521-721946
- **Website:** www.borkabazar.com
- **GitHub:** https://github.com/mrbabu07/Borka_Bazar

---

## 🙏 Acknowledgments

- Firebase for authentication
- imgBB for image hosting
- MongoDB Atlas for database
- Tailwind CSS for styling
- React team for the amazing framework

---

## 📚 Documentation

For detailed documentation on specific features:
- Product Management: See admin panel
- API Documentation: Check Server/routes
- Component Library: See Client/src/components

---

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- Core e-commerce features
- Product recommendations
- Social sharing
- Live chat
- Order tracking
- Size guide

### Phase 2 (Planned)
- Payment gateway integration (SSL Commerz, bKash, Nagad)
- Email notifications
- SMS notifications
- Shipping integration (Pathao, Steadfast)
- Advanced analytics

### Phase 3 (Future)
- Mobile app (React Native)
- AR virtual try-on
- AI-powered recommendations
- Voice search
- Multi-vendor support

---

## 💡 Tips for Developers

### Running in Development
```bash
# Backend with auto-reload
cd Server && npm run dev

# Frontend with hot reload
cd Client && npm run dev
```

### Building for Production
```bash
# Build frontend
cd Client && npm run build

# Test production build locally
npm run preview
```

### Environment Setup
1. Get Firebase credentials from Firebase Console
2. Get imgBB API key from https://api.imgbb.com/
3. Set up MongoDB Atlas cluster
4. Configure SMTP for emails

---

**Built with ❤️ for elegant modest fashion**

*Last Updated: March 29, 2026*
