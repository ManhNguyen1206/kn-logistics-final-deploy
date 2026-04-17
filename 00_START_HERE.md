# 🚀 KN-Logistics Deployment Guide

Welcome! This project is a **React 18 + Firebase + Vite** logistics management application. Follow these steps to get it running.

## ⚡ Quick Start (30 seconds)

```bash
npm install
npm run dev
```

Visit: **http://localhost:5173**

## 🌍 Deploy to Production (1 command)

```bash
npm run build && vercel --prod
```

The app will be live in ~2 minutes at your Vercel URL.

## 📋 What's Inside

- **React 18** - Modern UI framework
- **Firebase** - Real-time database & authentication
- **Vite 5** - Lightning-fast bundler
- **TypeScript** - Type safety
- **Tailwind CSS** - Beautiful styling
- **Lucide Icons** - Clean icon library

## 🔐 Security

- Credentials stored in `.env.local` (never commit this!)
- Admin password required for protected features
- All sensitive data protected from git

## 📚 Documentation

- [`ONE_COMMAND_DEPLOY.md`](./ONE_COMMAND_DEPLOY.md) - Single command deployment
- [`DEPLOYMENT_INSTRUCTIONS.md`](./DEPLOYMENT_INSTRUCTIONS.md) - Detailed deployment steps
- [`QUICK_START_TERMINAL.md`](./QUICK_START_TERMINAL.md) - Terminal-based quick start
- [`PRODUCTION_VALIDATION_CHECKLIST.md`](./PRODUCTION_VALIDATION_CHECKLIST.md) - Pre-production checklist
- [`stackblitz-launch.md`](./stackblitz-launch.md) - Deploy to Stackblitz
- [`MACOS_EXECUTION_GUIDE.md`](./MACOS_EXECUTION_GUIDE.md) - macOS specific guide
- [`README_DEPLOYMENT_GUIDE.md`](./README_DEPLOYMENT_GUIDE.md) - Comprehensive guide

## ✅ Next Steps

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Test locally at http://localhost:5173
4. Login with admin password: `TestPass123@`
5. Deploy: `npm run build && vercel --prod`

## 🆘 Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 3000
```

**Build fails?**
```bash
npm run type-check  # Check TypeScript errors
npm run lint        # Check code style
```

**Firebase connection issues?**
- Verify `.env.local` has correct Firebase credentials
- Check Firebase Console for security rules

---

**Ready to deploy?** → [`ONE_COMMAND_DEPLOY.md`](./ONE_COMMAND_DEPLOY.md)
