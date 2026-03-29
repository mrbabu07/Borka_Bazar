# 🚀 Deployment Guide - Borka Bazar

Quick guide to deploy your e-commerce platform to production.

---

## Prerequisites

- ✅ Node.js installed
- ✅ Backend API deployed and running
- ✅ Firebase project configured
- ✅ ImgBB API key obtained
- ✅ Git repository set up

---

## Step 1: Update Environment Variables

Before deploying, update your environment variables for production:

### Create `.env.production` file:

```env
# Production Backend API
VITE_API_URL=https://your-backend-api.com/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBkaoo7n7o86_wn_Huo0hhI5Cq7yHUnX-E
VITE_FIREBASE_AUTH_DOMAIN=hnilabazar-a984e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hnilabazar-a984e
VITE_FIREBASE_STORAGE_BUCKET=hnilabazar-a984e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=584493637272
VITE_FIREBASE_APP_ID=1:584493637272:web:b7cde82b680284482ebaed

# ImgBB API
VITE_IMGBB_API_KEY=ee04219d2d8004fb219121867f3d4c74
```

**Important:** Replace `https://your-backend-api.com/api` with your actual backend URL!

---

## Step 2: Test Build Locally

```bash
cd Client
npm run build
npm run preview
```

Visit `http://localhost:4173` to test the production build locally.

---

## Step 3: Deploy to Netlify (Recommended)

### Option A: Deploy via Netlify UI

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Build Settings:**
   - Base directory: `Client`
   - Build command: `npm run build`
   - Publish directory: `Client/dist`

4. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add all variables from `.env.production`

5. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site is live! 🎉

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from Client directory
cd Client
netlify deploy --prod

# Follow prompts:
# - Create new site or link existing
# - Publish directory: dist
```

---

## Step 4: Deploy to Vercel (Alternative)

### Option A: Deploy via Vercel UI

1. **Push to GitHub** (same as Netlify)

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your repository

3. **Configure:**
   - Root Directory: `Client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework Preset: Vite

4. **Add Environment Variables:**
   - Add all variables from `.env.production`

5. **Deploy!**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from Client directory
cd Client
vercel --prod
```

---

## Step 5: Post-Deployment Checklist

### ✅ Immediate Testing:
- [ ] Visit your deployed site
- [ ] Test user registration/login
- [ ] Browse products
- [ ] Add items to cart
- [ ] Test size selection
- [ ] Complete a test order
- [ ] Check admin dashboard
- [ ] Test category management
- [ ] Verify delivery charge calculation
- [ ] Test on mobile device

### ✅ Configuration:
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificate (auto on Netlify/Vercel)
- [ ] Set up redirects if needed
- [ ] Configure CORS on backend for your domain

### ✅ Monitoring:
- [ ] Set up error tracking (Sentry)
- [ ] Add analytics (Google Analytics)
- [ ] Monitor performance (Lighthouse)
- [ ] Check console for errors

---

## Step 6: Backend Configuration

Make sure your backend allows requests from your frontend domain:

```javascript
// In your backend CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-netlify-site.netlify.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
};
```

---

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for syntax errors: `npm run lint`

### API Not Connecting
- Verify VITE_API_URL is correct
- Check CORS configuration on backend
- Verify backend is running and accessible

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Rebuild after changing variables
- Check Netlify/Vercel dashboard for correct values

### 404 Errors on Refresh
- Verify `netlify.toml` or `vercel.json` redirects are configured
- Check SPA routing configuration

---

## Performance Optimization (Optional)

### After Initial Deployment:

1. **Run Lighthouse Audit:**
   - Open Chrome DevTools
   - Go to Lighthouse tab
   - Run audit
   - Fix issues

2. **Optimize Images:**
   - Convert to WebP format
   - Add lazy loading
   - Use responsive images

3. **Code Splitting:**
   - Implement dynamic imports for admin pages
   - Split vendor chunks

4. **Enable Compression:**
   - Gzip/Brotli (auto on Netlify/Vercel)

---

## Maintenance

### Regular Tasks:
- Monitor error logs weekly
- Update dependencies monthly
- Backup database regularly
- Review analytics data
- Test critical flows

### Updates:
```bash
# Pull latest changes
git pull origin main

# Install dependencies
cd Client
npm install

# Test locally
npm run build
npm run preview

# Deploy
git push origin main  # Auto-deploys on Netlify/Vercel
```

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Review Netlify/Vercel build logs
3. Verify environment variables
4. Test backend API separately
5. Check CORS configuration

---

## 🎉 Congratulations!

Your Borka Bazar e-commerce platform is now live!

**Next Steps:**
- Share the link with users
- Monitor performance
- Gather feedback
- Plan future features

---

**Deployed Site:** `https://your-site.netlify.app`  
**Admin Dashboard:** `https://your-site.netlify.app/admin/dashboard`  
**Backend API:** `https://your-backend-api.com`

Happy selling! 🛍️
