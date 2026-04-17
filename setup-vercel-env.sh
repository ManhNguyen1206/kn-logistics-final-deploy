#!/bin/bash

# KN-Logistics Vercel Environment Setup Script
# Sets up all required environment variables in Vercel
# Works on macOS and Linux

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  KN-Logistics Vercel Environment Setup                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "📝 Please log in to Vercel:"
    vercel login
fi

echo ""
echo "📋 This script will set environment variables for your Vercel project."
echo ""

# Firebase Configuration
echo "Enter your Firebase credentials:"
echo "(You can find these in Firebase Console → Project Settings → Service Accounts)"
echo ""

read -p "Firebase API Key: " FIREBASE_API_KEY
read -p "Firebase Auth Domain (e.g., project.firebaseapp.com): " FIREBASE_AUTH_DOMAIN
read -p "Firebase Project ID: " FIREBASE_PROJECT_ID
read -p "Firebase Storage Bucket (e.g., project.appspot.com): " FIREBASE_STORAGE_BUCKET
read -p "Firebase Messaging Sender ID (can be empty): " FIREBASE_MESSAGING_SENDER_ID
read -p "Firebase App ID (can be empty): " FIREBASE_APP_ID

# Admin Configuration
echo ""
read -sp "Admin Password (will not echo): " ADMIN_PASSWORD
echo ""

# Confirm before setting
echo ""
echo "📝 Will set the following environment variables:"
echo "   • VITE_FIREBASE_API_KEY"
echo "   • VITE_FIREBASE_AUTH_DOMAIN"
echo "   • VITE_FIREBASE_PROJECT_ID"
echo "   • VITE_FIREBASE_STORAGE_BUCKET"
echo "   • VITE_FIREBASE_MESSAGING_SENDER_ID"
echo "   • VITE_FIREBASE_APP_ID"
echo "   • VITE_ADMIN_PASSWORD"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 1
fi

# Set environment variables
echo ""
echo "🚀 Setting environment variables in Vercel..."
echo ""

vercel env add VITE_FIREBASE_API_KEY <<< "$FIREBASE_API_KEY" && echo "✅ VITE_FIREBASE_API_KEY"
vercel env add VITE_FIREBASE_AUTH_DOMAIN <<< "$FIREBASE_AUTH_DOMAIN" && echo "✅ VITE_FIREBASE_AUTH_DOMAIN"
vercel env add VITE_FIREBASE_PROJECT_ID <<< "$FIREBASE_PROJECT_ID" && echo "✅ VITE_FIREBASE_PROJECT_ID"
vercel env add VITE_FIREBASE_STORAGE_BUCKET <<< "$FIREBASE_STORAGE_BUCKET" && echo "✅ VITE_FIREBASE_STORAGE_BUCKET"
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID <<< "$FIREBASE_MESSAGING_SENDER_ID" && echo "✅ VITE_FIREBASE_MESSAGING_SENDER_ID"
vercel env add VITE_FIREBASE_APP_ID <<< "$FIREBASE_APP_ID" && echo "✅ VITE_FIREBASE_APP_ID"
vercel env add VITE_ADMIN_PASSWORD <<< "$ADMIN_PASSWORD" && echo "✅ VITE_ADMIN_PASSWORD"

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "🔄 Redeploying to apply changes..."
vercel --prod

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Your app is now live with environment variables configured."
echo ""
echo "📊 View your project: vercel dashboard"
echo "🌐 Open your app: (check Vercel output above)"
echo ""
