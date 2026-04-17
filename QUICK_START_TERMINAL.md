# ⚡ Quick Start - Terminal Commands

Copy and paste these commands to get started fast.

## 1️⃣ First Time Setup (5 minutes)

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit and add your Firebase credentials
nano .env.local
# (or use your preferred editor: vim, code, etc.)

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## 2️⃣ Local Development (ongoing)

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint code
npm run lint

# Build locally
npm run build

# Preview build
npm run preview
```

## 3️⃣ First Deployment to Vercel

```bash
# Install Vercel CLI globally
npm i -g vercel

# Authenticate
vercel login

# Link project
vercel

# Deploy to production
npm run build && vercel --prod
```

## 4️⃣ After Code Changes

```bash
# Quick redeploy
npm run build && vercel --prod

# Or with automatic Git integration
git add .
git commit -m "Update KN-Logistics"
git push
# (Vercel auto-deploys)
```

## 📋 Common Commands

```bash
# Clean install (if npm errors)
rm -rf node_modules package-lock.json
npm install

# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# View Vercel project
vercel --prod

# Open Vercel dashboard
vercel dashboard

# View deployment logs
vercel logs

# Rollback last deployment
vercel rollback

# List all deployments
vercel ls
```

## 🔧 Troubleshooting Commands

```bash
# Check Node.js version
node --version
# Should be 18.0.0 or higher

# Check npm version
npm --version
# Should be 9.0.0 or higher

# Check if port 5173 is in use
lsof -i :5173
# Kill process: kill -9 <PID>

# Clear npm cache
npm cache clean --force

# Reinstall everything
rm -rf node_modules dist
npm install
npm run build
```

## 🚀 One-Line Commands

```bash
# Full dev setup from scratch
npm install && npm run dev

# Build and deploy
npm run build && vercel --prod

# Type-check, lint, and build
npm run type-check && npm run lint && npm run build

# Setup Vercel env and deploy
./setup-vercel-env.sh && npm run build && vercel --prod
```

## 📊 Project Structure

```
kn-logistics-final/
├── src/
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── dist/                    # Production build
├── index.html               # HTML template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── vercel.json              # Vercel config
├── .env.local               # Secrets (DON'T commit)
├── .env.local.example       # Template (OK to commit)
├── .gitignore               # Git ignore rules
└── docs/                    # Documentation
```

## 🔑 Environment Variables

Required in `.env.local`:

```bash
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ADMIN_PASSWORD=your_password
```

## 📱 Testing Checklist

After `npm run dev`:

- [ ] App loads at http://localhost:5173
- [ ] No errors in console
- [ ] Login with admin password works
- [ ] Create/edit entries works
- [ ] Firebase sync is real-time
- [ ] Mobile responsive

## 🎯 Deployment Checklist

Before `npm run build && vercel --prod`:

- [ ] Local tests pass
- [ ] `.env.local` has all credentials
- [ ] `.env.local` is in `.gitignore`
- [ ] Vercel account created
- [ ] Vercel CLI installed
- [ ] Logged into Vercel CLI

## ✅ Success Indicators

**Development:**
```bash
$ npm run dev
VITE v5.0.8
➜  Local:   http://localhost:5173/
```

**Build:**
```bash
$ npm run build
✓ 1234 modules transformed
dist/index.html         0.48 kB
dist/index.js         125.34 kB
```

**Deployment:**
```bash
$ vercel --prod
🎉 Production: https://your-project.vercel.app
```

---

**Need details?** → [`DEPLOYMENT_INSTRUCTIONS.md`](./DEPLOYMENT_INSTRUCTIONS.md)

**Stuck?** → [`00_START_HERE.md`](./00_START_HERE.md)
