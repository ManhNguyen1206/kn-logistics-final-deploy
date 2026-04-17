# 🍎 macOS Execution Guide

Complete guide for deploying KN-Logistics on macOS.

## ✅ Prerequisites Check

Open Terminal and verify:

```bash
# Check Node.js
node --version
# Should output: v18.0.0 or higher

# Check npm
npm --version
# Should output: 9.0.0 or higher

# Check Git
git --version
# Should output: git version 2.x.x or higher
```

If any are missing, install via Homebrew:

```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (includes npm)
brew install node

# Install Git
brew install git
```

## 📁 Project Setup

### Step 1: Clone or Extract Project

**Option A: Clone from GitHub**
```bash
git clone https://github.com/YOUR_USERNAME/kn-logistics.git
cd kn-logistics
```

**Option B: Extract from ZIP**
```bash
unzip kn-logistics.zip
cd kn-logistics-final
```

### Step 2: Install Dependencies

```bash
npm install
```

Expected output:
```
added 187 packages in 45s
```

## ⚙️ Environment Setup

### Create `.env.local`

```bash
# Copy example to actual file
cp .env.local.example .env.local

# Edit with your editor
nano .env.local
```

Or open in VS Code:
```bash
code .env.local
```

Add Firebase credentials:
```
VITE_FIREBASE_API_KEY=AIzaSyAWQUm1ZmcHkScjh7sjM2uQb0YxrEwtDs8
VITE_FIREBASE_AUTH_DOMAIN=kn-logistics.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kn-logistics
VITE_FIREBASE_STORAGE_BUCKET=kn-logistics.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_PASSWORD=TestPass123@
```

Save: **Ctrl+X** → **Y** → **Enter** (in nano)

## 🚀 Local Development

### Start Dev Server

```bash
npm run dev
```

Output:
```
VITE v5.0.8  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Open in Browser

```bash
# Automatic (usually opens)
# Or manually open:
open http://localhost:5173
```

### Test Locally

- [ ] App loads
- [ ] Login works with password
- [ ] Create/edit entries works
- [ ] Real-time sync works
- [ ] No red errors in console

### Stop Dev Server

Press **Ctrl+C** in Terminal

## 🏗️ Build for Production

### Type Check

```bash
npm run type-check
```

Should output:
```
No errors found.
```

### Lint Code

```bash
npm run lint
```

Should show minimal or no warnings.

### Build

```bash
npm run build
```

Output:
```
✓ 1234 modules transformed
dist/index.html                  0.48 kB
dist/index.js                  125.34 kB
dist/vendor-react.js             42.12 kB
dist/vendor-firebase.js          87.45 kB
```

### Preview Build

```bash
npm run preview
```

Opens: http://localhost:5173 (built version)

Press **Ctrl+C** to stop.

## 🚀 Deploy to Vercel

### One-Time Vercel Setup

```bash
# Install Vercel CLI globally
npm install -g vercel

# Authenticate
vercel login
```

Follow browser prompts to authorize.

### Link Project to Vercel

```bash
vercel
```

Answer prompts:
```
? Set up and deploy? Yes
? Which scope? Your account
? Link to existing project? No
? What's your project's name? kn-logistics
? In which directory is your code? .
? Want to modify these settings? No
```

### Deploy to Production

```bash
npm run build && vercel --prod
```

Expected output:
```
Vercel CLI 32.x.x
Production: https://kn-logistics-abc123.vercel.app 🎉
```

## 🔄 Continuous Deployment (Optional)

### Push to GitHub

```bash
# Initialize git repo (if not already)
git init
git add .
git commit -m "Initial KN-Logistics deployment"

# Create GitHub repo at github.com/new
# Then add remote:
git remote add origin https://github.com/YOUR_USERNAME/kn-logistics.git
git branch -M main
git push -u origin main
```

### Enable Auto-Deploy

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Settings → Git Integration
4. Connect GitHub repo
5. Every `git push` auto-deploys!

## 📊 Monitor Deployment

### View Logs

```bash
vercel logs
```

### Check Status

```bash
vercel status
```

### List Deployments

```bash
vercel ls
```

### Rollback if Needed

```bash
vercel rollback
```

## 🔧 Troubleshooting macOS

### Port 5173 Already in Use

```bash
# Find what's using it
lsof -i :5173

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### npm permission errors

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Then reinstall
npm install -g vercel
```

### Node modules issues

```bash
# Complete clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Firewall blocks Firebase

If Firebase doesn't connect:
1. System Preferences → Security & Privacy → Firewall
2. Click **Firewall Options**
3. Unblock relevant ports or allow Node.js

## 🎯 Quick Command Reference

```bash
# Development
npm run dev              # Start dev server
npm run type-check      # Check TypeScript
npm run lint            # Lint code

# Building
npm run build           # Create production build
npm run preview         # Preview built app

# Deployment
vercel                  # Link to Vercel
vercel --prod          # Deploy to production
vercel logs            # View deployment logs
vercel rollback        # Undo last deployment

# Utilities
npm install            # Install dependencies
npm update             # Update packages
npm audit              # Check security
npm audit fix          # Fix vulnerabilities
npm cache clean --force # Clear cache
```

## 📋 Full Deployment Checklist - macOS

- [ ] Install Node.js and npm
- [ ] Clone/extract project
- [ ] Run `npm install`
- [ ] Create `.env.local` with credentials
- [ ] Run `npm run dev` and verify locally
- [ ] Run `npm run type-check` passes
- [ ] Run `npm run lint` passes
- [ ] Run `npm run build` succeeds
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Link project: `vercel`
- [ ] Deploy: `npm run build && vercel --prod`
- [ ] Verify at Vercel URL

## 💡 Pro Tips for macOS

### Use iTerm2 Instead of Terminal
```bash
brew install iterm2
```
Better terminal with split panes, themes.

### Use VS Code
```bash
brew install visual-studio-code
```
Integrated terminal, great for development.

### Use Oh My Zsh (Optional)
```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```
Better shell with Git integration, plugins.

### Create Shell Alias

Add to `~/.zshrc`:
```bash
alias deploy="npm run build && vercel --prod"
```

Then deploy with: `deploy`

## 🔗 Resources

- **Vercel Docs**: https://vercel.com/docs
- **Node.js**: https://nodejs.org
- **Homebrew**: https://brew.sh
- **Firebase Console**: https://console.firebase.google.com

---

**Successfully deployed?** Check your live site at the Vercel URL! 🎉

**Need help?** → [`DEPLOYMENT_INSTRUCTIONS.md`](./DEPLOYMENT_INSTRUCTIONS.md)
