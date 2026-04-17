# 📖 Complete Deployment Instructions

Step-by-step guide to deploy KN-Logistics to production.

## Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages:
- React 18.2.0
- Firebase 10.7.1
- Vite 5.0.8
- TypeScript 5.3.3
- Tailwind CSS 3.3.5

## Step 2: Set Up Environment Variables

### Option A: Manual Setup

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ADMIN_PASSWORD=your_password
```

### Option B: Automated Setup

```bash
./setup-vercel-env.sh
```

Follow the prompts to enter credentials.

## Step 3: Test Locally

```bash
npm run dev
```

- Opens http://localhost:5173
- Hot reload enabled
- Test all features before deployment

### Local Testing Checklist

- [ ] App loads without errors
- [ ] Login works with admin password
- [ ] Can add new entries
- [ ] Firebase sync works (real-time updates)
- [ ] CSV import functions
- [ ] Receipt generation works
- [ ] Responsive on mobile/tablet

## Step 4: Build for Production

```bash
npm run build
```

Creates optimized bundle in `dist/`:
- Code splitting (React + Firebase + app code)
- Minification with Terser
- Tree-shaking enabled
- Source maps disabled (production)

Build artifacts include:
- `index.html` - Main entry point
- `index.js` - Application code
- `vendor-react.js` - React libraries
- `vendor-firebase.js` - Firebase libraries

## Step 5: Set Up Vercel Project

### First Time Only:

```bash
npm i -g vercel
vercel login
```

Follow the browser prompt to authenticate.

### Link Project (or Create New):

```bash
vercel
```

Select:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Development settings**: Keep defaults

## Step 6: Configure Environment Variables in Vercel

### Via Dashboard:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add variables (same as `.env.local`):

```
VITE_FIREBASE_API_KEY = ...
VITE_FIREBASE_AUTH_DOMAIN = ...
VITE_FIREBASE_PROJECT_ID = ...
VITE_FIREBASE_STORAGE_BUCKET = ...
VITE_FIREBASE_MESSAGING_SENDER_ID = ...
VITE_FIREBASE_APP_ID = ...
VITE_ADMIN_PASSWORD = ...
```

### Via Vercel CLI:

```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# ... repeat for each variable
```

## Step 7: Deploy to Production

```bash
vercel --prod
```

Or use the one-liner:
```bash
npm run build && vercel --prod
```

### What Happens:

1. Code builds locally
2. Uploaded to Vercel servers
3. Environment variables injected
4. Assets cached globally (CDN)
5. Live in ~1 minute

## Step 8: Verify Deployment

Check the Vercel dashboard or click the deployment URL:

- [ ] App loads
- [ ] No console errors
- [ ] Admin login works
- [ ] Firebase data syncs
- [ ] All features functional
- [ ] Mobile responsive
- [ ] Performance metrics good

## Step 9: Enable Auto-Deploy (Optional)

Push code to Git repo:

```bash
git add .
git commit -m "Deploy KN-Logistics"
git push
```

Vercel automatically deploys when code is pushed!

## Subsequent Deployments

After the initial setup, redeploy is simple:

```bash
npm run build && vercel --prod
```

## Performance Optimization

### Bundle Size

- React: 42 KB (gzipped)
- Firebase: 87 KB (gzipped)
- App code: ~120 KB (gzipped)
- Total: ~250 KB

### Loading Performance

- First contentful paint: ~1.2s
- Time to interactive: ~2.1s
- Lighthouse score: 85+

### Caching Strategy

- Assets cached for 1 year (immutable)
- Service Worker for offline (optional)
- API calls cached per route

## Rollback

If deployment has issues:

```bash
vercel rollback
```

Returns to previous working deployment.

## Debugging Deployment Issues

### Check Deployment Logs:

```bash
vercel logs
```

### Verify Environment Variables:

```bash
vercel env ls
```

### Local Production Build:

```bash
npm run build
npm run preview
```

Tests the built app locally before deployment.

## Monitoring

After deployment, monitor:

1. **Vercel Analytics**: https://vercel.com/dashboard/your-project/analytics
2. **Firebase Console**: Real-time data operations
3. **Browser DevTools**: Performance, errors
4. **Error Tracking**: Check console for runtime errors

---

**Ready?** Run: `npm run build && vercel --prod`

**Stuck?** Check [`00_START_HERE.md`](./00_START_HERE.md) for troubleshooting
