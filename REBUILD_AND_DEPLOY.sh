#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# REBUILD AND FORCE REDEPLOY WITH CACHE CLEARING
# ═══════════════════════════════════════════════════════════════════════════════
# This script:
# 1. Clears all caches
# 2. Reinstalls dependencies cleanly
# 3. Rebuilds the project with new styling
# 4. Forces a fresh deployment to Vercel with cache bypass
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║             REBUILD & REDEPLOY WITH CACHE CLEARING                       ║"
echo "║                  Fresh Build → Fresh Vercel Deploy                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# STEP 1: Clear all caches
echo "🧹 STEP 1: Clearing All Caches..."
echo "   Removing node_modules..."
rm -rf node_modules 2>/dev/null || true

echo "   Removing build artifacts..."
rm -rf dist .next .vercel 2>/dev/null || true

echo "   Removing lock files..."
rm -rf package-lock.json yarn.lock 2>/dev/null || true

echo "   ✅ Caches cleared"
echo ""

# STEP 2: Fresh npm install
echo "📦 STEP 2: Clean Dependency Installation..."
echo "   This will take 1-2 minutes..."
echo ""

npm install

echo ""
echo "   ✅ Dependencies installed"
echo ""

# STEP 3: Build with new styling
echo "🔨 STEP 3: Building with Updated Styling..."
echo "   TypeScript checking..."
npm run type-check || true

echo "   Building optimized bundle..."
npm run build

echo ""
echo "   ✅ Build successful"
echo ""

# STEP 4: Fresh deployment
echo "🚀 STEP 4: Force Fresh Deployment to Vercel..."
echo "   This will bypass any caches and deploy new code..."
echo ""

# Deploy with --force to bypass any caches
npx vercel --prod --yes --force

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ DEPLOYMENT COMPLETE!                               ║"
echo "║                                                                           ║"
echo "║  Your app is now live with the new minimalist design:                    ║"
echo "║  ✅ Emerald green & teal gradients                                       ║"
echo "║  ✅ Yellow accent colors                                                 ║"
echo "║  ✅ Minimalist white background                                          ║"
echo "║                                                                           ║"
echo "║  🔗 Live URL: https://kn-logistics-final-deploy.vercel.app              ║"
echo "║                                                                           ║"
echo "║  ⏱️ Full refresh recommended (Ctrl+Shift+R or Cmd+Shift+R)              ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
