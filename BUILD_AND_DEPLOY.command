#!/bin/bash
cd ~/kn-logistics/kn-logistics-final-deploy && npm run build && npx vercel --prod --yes --force
