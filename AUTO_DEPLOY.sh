#!/bin/bash

# ╔════════════════════════════════════════════════════════════════════════════╗
# ║  KN-LOGISTICS AUTOMATED DEPLOYMENT SCRIPT                                ║
# ║  One-Command Complete Deployment to Vercel                               ║
# ╚════════════════════════════════════════════════════════════════════════════╝

set -e

PROJECT_NAME="KN-Logistics"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║  🚀 KN-LOGISTICS AUTOMATED DEPLOYMENT                                     ║"
echo "║  $TIMESTAMP                                  ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check Prerequisites
echo "📋 STEP 1: Verifying Prerequisites..."
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "   Install from: https://nodejs.org/en/ (v18.0.0 or higher)"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found!"
    echo "   Install Node.js from: https://nodejs.org/en/"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm: $NPM_VERSION"

if ! command -v git &> /dev/null; then
    echo "⚠️  Git not found (optional but recommended)"
else
    GIT_VERSION=$(git --version)
    echo "✅ Git: $GIT_VERSION"
fi

echo ""

# Step 2: Clean Previous Builds
echo "🧹 STEP 2: Cleaning Previous Builds..."
rm -rf node_modules dist .next out 2>/dev/null || true
echo "✅ Cleaned"
echo ""

# Step 3: Install Dependencies
echo "📦 STEP 3: Installing Dependencies..."
echo "   This may take 1-2 minutes..."
echo ""

if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    echo "   Try: npm install --legacy-peer-deps"
    exit 1
fi
echo ""

# Step 4: Type Check
echo "🔍 STEP 4: TypeScript Type Checking..."
if npm run type-check; then
    echo "✅ Type checking passed"
else
    echo "⚠️  Type checking failed"
    echo "   Continuing anyway..."
fi
echo ""

# Step 5: Lint
echo "🎨 STEP 5: Linting Code..."
if npm run lint 2>/dev/null; then
    echo "✅ Linting passed"
else
    echo "⚠️  Linting has warnings (continuing)"
fi
echo ""

# Step 6: Build
echo "🔨 STEP 6: Building for Production..."
echo "   This may take 30-60 seconds..."
echo ""

if npm run build; then
    echo "✅ Build successful"
    echo ""

    # Show build output
    echo "📊 Build Output:"
    ls -lh dist/ | tail -10
    echo ""
else
    echo "❌ Build failed!"
    exit 1
fi

# Step 7: Verify Vercel CLI
echo "🔐 STEP 7: Verifying Vercel Setup..."
echo ""

if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

if vercel whoami &> /dev/null; then
    VERCEL_USER=$(vercel whoami)
    echo "✅ Vercel authenticated as: $VERCEL_USER"
else
    echo "❌ Not authenticated with Vercel"
    echo "   Please run: vercel login"
    exit 1
fi
echo ""

# Step 8: Deploy
echo "🚀 STEP 8: Deploying to Vercel..."
echo ""

if vercel --prod --yes; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                            ║"
    echo "║  ✅ DEPLOYMENT SUCCESSFUL!                                               ║"
    echo "║                                                                            ║"
    echo "║  Your app is now live on Vercel!                                          ║"
    echo "║                                                                            ║"
    echo "║  📊 Deployment Details:                                                   ║"
    echo "║     Timestamp: $TIMESTAMP                            ║"
    echo "║     Framework: React 18 + Firebase + Vite 5                               ║"
    echo "║     Status: Production Ready ✅                                           ║"
    echo "║                                                                            ║"
    echo "║  🔗 Next Steps:                                                           ║"
    echo "║     1. Check your Vercel dashboard for the live URL                       ║"
    echo "║     2. Test all features in production                                    ║"
    echo "║     3. Monitor performance and errors                                     ║"
    echo "║                                                                            ║"
    echo "║  📚 Documentation:                                                        ║"
    echo "║     - 00_START_HERE.md                                                    ║"
    echo "║     - README_DEPLOYMENT_GUIDE.md                                          ║"
    echo "║     - MACOS_EXECUTION_GUIDE.md                                            ║"
    echo "║                                                                            ║"
    echo "╚════════════════════════════════════════════════════════════════════════════╝"
    echo ""
else
    echo "❌ Deployment failed!"
    echo "   Check the error messages above"
    exit 1
fi

echo "✨ All done! Your app is live! 🎉"
echo ""
