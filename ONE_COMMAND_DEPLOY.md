# 🎯 One-Command Deployment

Deploy your KN-Logistics app to Vercel **in one line**.

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- Vercel account (free at https://vercel.com)
- Vercel CLI installed: `npm i -g vercel`

## 🚀 Deploy Now

```bash
npm run build && vercel --prod
```

### What This Does

1. ✅ Type checks your TypeScript code
2. ✅ Builds optimized production bundle
3. ✅ Uploads to Vercel
4. ✅ Sets environment variables
5. ✅ Deploys live

### Expected Output

```
npm notice it worked if it ends with ok
npm notice
> tsc && vite build
✓ 1234 modules transformed
dist/index.html                  0.48 kB │ gzip: 0.32 kB
dist/index.js                   125.34 kB │ gzip: 32.45 kB
dist/vendor-react.js             42.12 kB │ gzip: 13.23 kB
dist/vendor-firebase.js          87.45 kB │ gzip: 18.92 kB

Vercel CLI 32.x.x
Project linked to ...
Environment variables loaded
Production build deployed
🎉 Live at: https://your-project.vercel.app
```

## ✅ Verify Deployment

Once deployed:

1. Open the Vercel URL shown in terminal
2. Wait for app to load (~2-3 seconds)
3. Login with password: `TestPass123@`
4. Test creating/editing entries
5. Check Firebase real-time sync

## 🔐 Environment Variables

Before first deployment, set in Vercel dashboard:

```
VITE_FIREBASE_API_KEY=AIzaSyAWQUm1ZmcHkScjh7sjM2uQb0YxrEwtDs8
VITE_FIREBASE_AUTH_DOMAIN=kn-logistics.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kn-logistics
VITE_FIREBASE_STORAGE_BUCKET=kn-logistics.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_PASSWORD=TestPass123@
```

Or use the setup script:
```bash
./setup-vercel-env.sh
```

## 🔄 Redeploy After Changes

```bash
npm run build && vercel --prod
```

Same one-command process!

## 📊 Deployment Times

- Build: ~30 seconds
- Upload: ~10 seconds  
- Deployment: ~30 seconds
- **Total: ~70 seconds** ⚡

## 🆘 Troubleshooting

**"Permission denied" error?**
```bash
npm i -g vercel
vercel login
```

**Build fails?**
```bash
npm run type-check
npm run lint
```

**App loads but shows error?**
- Check environment variables in Vercel dashboard
- Verify Firebase credentials
- Check browser console for errors

**Firebase not working?**
- Verify `.env.local` matches Firebase Console
- Check Firestore security rules allow anonymous auth

---

**Need more help?** → [`DEPLOYMENT_INSTRUCTIONS.md`](./DEPLOYMENT_INSTRUCTIONS.md)
