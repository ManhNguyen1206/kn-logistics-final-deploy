# 🎯 Launch on Stackblitz (Zero Setup)

Deploy KN-Logistics to Stackblitz in seconds with **zero local setup**.

## What is Stackblitz?

Stackblitz is a cloud IDE that runs Node.js and npm entirely in the browser. Perfect for:
- Quick demos
- Development without local setup
- Sharing working code
- Testing before production

## 🚀 One-Click Deploy

### Option 1: Via GitHub (Fastest)

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "KN-Logistics ready for Stackblitz"
   git push origin main
   ```

2. **Open Stackblitz**: https://stackblitz.com/github/YOUR_USERNAME/kn-logistics

   Replace `YOUR_USERNAME` with your GitHub username.

3. **Click "Open in Stackblitz"** → Project imports automatically

### Option 2: Direct GitHub URL

Paste this URL directly (replace `YOUR_USERNAME`):

```
https://stackblitz.com/github/YOUR_USERNAME/kn-logistics
```

## 📝 Project Configuration

The following files enable Stackblitz auto-detection:

✅ **Already included:**
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration  
- `tsconfig.json` - TypeScript settings
- `index.html` - Entry point
- `.gitignore` - Git configuration

Stackblitz automatically:
- Installs dependencies
- Detects Vite as the build tool
- Starts dev server on port 5173
- Opens preview in side panel

## 🔐 Set Environment Variables

In Stackblitz editor:

1. Click **Secret** (lock icon) in bottom toolbar
2. Add environment variables:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyAWQUm1ZmcHkScjh7sjM2uQb0YxrEwtDs8
   VITE_FIREBASE_AUTH_DOMAIN=kn-logistics.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=kn-logistics
   VITE_FIREBASE_STORAGE_BUCKET=kn-logistics.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_ADMIN_PASSWORD=TestPass123@
   ```
3. Click **Update secret**
4. Refresh preview

## ✅ Verify in Stackblitz

- [ ] App loads in preview panel
- [ ] No red errors in console
- [ ] Can login with admin password
- [ ] Firebase syncs (real-time data)
- [ ] All features work

## 📤 Share Your Work

Once deployed to Stackblitz, share the URL:

```
https://stackblitz.com/github/YOUR_USERNAME/kn-logistics
```

Others can:
- View your code
- Run the app
- Edit and test changes
- Fork to their account

## 🔗 Create GitHub Badges

Add to your README.md:

```markdown
[![Open in Stackblitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/YOUR_USERNAME/kn-logistics)
```

## 🖊️ Edit Code in Stackblitz

1. Click any file in left sidebar
2. Make changes (auto-saves)
3. App hot-reloads automatically
4. See changes in preview

## 📦 Commands in Stackblitz

Use terminal (bottom panel):

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# View version info
npm list
```

## 🚀 Export to Production

From Stackblitz, export to:

### Option A: GitHub Push
```bash
# Terminal in Stackblitz
git push origin feature-branch
```

### Option B: Download ZIP
- File → Export as ZIP
- Extract locally
- Deploy from local machine

### Option C: Direct Vercel Deploy
- Click "Deploy"
- Select Vercel
- Authorize Vercel
- One-click production deploy

## 🎓 Learning in Stackblitz

Perfect for:
- Learning React + Firebase
- Teaching others
- Debugging code
- Experimenting with changes
- Sharing minimal reproductions

## ⚡ Performance in Stackblitz

- **Cold start**: ~30 seconds
- **First load**: ~2 seconds
- **Hot reload**: <1 second
- **Preview**: In-browser, instant

## 🔄 Keep in Sync

To keep GitHub and Stackblitz in sync:

```bash
# Locally
git add .
git commit -m "Update code"
git push

# In Stackblitz
# Click "Sync from GitHub" (if available)
# Or refresh the page
```

## 🆘 Troubleshooting Stackblitz

**App not loading?**
- Check browser console for errors
- Verify environment variables set
- Restart dev server (click refresh)

**Firebase not connecting?**
- Verify `.env` variables in Secrets
- Check Firebase project exists
- Verify network in browser DevTools

**Dependencies not installing?**
- Try `npm install` in terminal
- Check for typos in package.json
- Clear npm cache

**Port conflict?**
- Stackblitz handles this automatically
- Use provided preview URL

## 📚 Resources

- **Stackblitz Docs**: https://docs.stackblitz.com
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Firebase Docs**: https://firebase.google.com/docs

## Quick Links

- **GitHub**: https://github.com/YOUR_USERNAME/kn-logistics
- **Stackblitz**: https://stackblitz.com/github/YOUR_USERNAME/kn-logistics
- **Production**: Deploy to Vercel when ready

---

**Next Step**: Push to GitHub, then open Stackblitz link above!

**Want to deploy to production?** → [`ONE_COMMAND_DEPLOY.md`](./ONE_COMMAND_DEPLOY.md)
