# 🧕 Borka Bazar - Modest Fashion eCommerce

A modern MERN stack eCommerce platform specializing in Burka (modest Islamic fashion for women).

## 🌟 Features

### Customer Features
- Browse Burka collection with advanced filters (fabric, style, occasion, size, color)
- Product search and filtering
- Shopping cart and wishlist
- User authentication (Firebase)
- Order management
- Product reviews and ratings
- Loyalty points system
- Flash sales
- Stock alerts
- COD (Cash on Delivery) payment

### Admin Features
- Product management with imgBB image hosting
- Category management with custom fields
- Order management
- Inventory tracking
- Customer insights and analytics
- Coupon management
- Flash sales management
- User management
- Return request handling
- Support ticket system

## 🛠️ Tech Stack

**Frontend:**
- React 19
- React Router v7
- Tailwind CSS
- Axios
- Firebase Authentication
- Framer Motion
- i18next (Multi-language support)

**Backend:**
- Node.js
- Express.js
- MongoDB (Native Driver + Mongoose)
- Firebase Admin SDK
- Web Push Notifications
- Nodemailer

## 📦 Project Structure

```
├── Client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── public/
├── Server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   └── scripts/          # Utility scripts
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Firebase project
- imgBB API key

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd borka-bazar
```

2. **Install Server Dependencies**
```bash
cd Server
npm install
```

3. **Install Client Dependencies**
```bash
cd ../Client
npm install
```

4. **Configure Environment Variables**

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
APP_NAME=Borka_Bazar
APP_EMAIL=your_email@gmail.com
FRONTEND_URL=http://localhost:5173

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your_email@example.com
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

# imgBB API Key for image uploads
VITE_IMGBB_API_KEY=your_imgbb_api_key
```

5. **Run the Application**

**Start Backend:**
```bash
cd Server
npm run dev
```

**Start Frontend:**
```bash
cd Client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📸 Image Hosting with imgBB

This project uses imgBB for image hosting instead of local storage:

1. Get your free API key from [imgBB](https://api.imgbb.com/)
2. Add it to `Client/.env.local` as `VITE_IMGBB_API_KEY`
3. Images are uploaded directly from the admin panel to imgBB
4. Only the permanent image URLs are stored in MongoDB

## 🎨 Design System

**Color Palette:**
- Primary: Black (#000000)
- Accent: Gold (#C9A84C)
- Background: White (#FFFFFF)

**Typography:**
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)

## 📱 Features in Detail

### Product Management
- Dynamic product fields for Burka-specific attributes
- Multiple image upload via imgBB
- Size and stock management per variant
- Category-specific custom fields
- Featured products
- Active/inactive status

### Order System
- COD (Cash on Delivery) only
- Automatic delivery charge calculation
- Free delivery threshold
- Coupon support
- Loyalty points redemption
- 30-minute cancellation window

### Customer Features
- Wishlist with sharing
- Product comparison
- Recently viewed products
- Stock alerts
- Product Q&A
- Review system

## 🔐 Security

- Firebase Authentication for secure user management
- Admin role verification
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 📊 Admin Analytics

- Sales analytics
- Customer insights
- Inventory tracking
- Low stock alerts
- Order statistics
- User management

## 🌐 Deployment

The application is ready for deployment on:
- Frontend: Netlify, Vercel
- Backend: Vercel, Railway, Render
- Database: MongoDB Atlas

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📧 Support

For support, email your.email@example.com or create an issue in the repository.

---

**Built with ❤️ for modest fashion**
