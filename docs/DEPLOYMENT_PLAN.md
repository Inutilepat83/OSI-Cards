# OSI Cards - GCP Deployment Plan (Europe)

## Overview

**Goal**: Deploy OSI Cards Angular SPA with minimal cost for low traffic  
**Region**: Europe (belgium `europe-west1`)  
**Estimated Monthly Cost**: **€0 - €2** (within free tier)

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS (Europe)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Hosting (CDN)                        │
│                    - Auto SSL/TLS                                │
│                    - Global CDN with EU edge                     │
│                    - Automatic compression                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloud Storage (europe-west1)                        │
│              - Static assets backup                              │
│              - Pre-rendered docs                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown

| Service               | Free Tier                 | Expected Usage | Cost   |
| --------------------- | ------------------------- | -------------- | ------ |
| Firebase Hosting      | 10 GB storage, 360 MB/day | ~50 MB/day     | **€0** |
| Cloud Storage         | 5 GB                      | ~100 MB        | **€0** |
| Cloud Build           | 120 min/day               | ~5 min/deploy  | **€0** |
| Budget Alert Function | 2M invocations            | ~30/month      | **€0** |
| **Total**             |                           |                | **€0** |

---

## Implementation Steps

### Phase 1: Firebase Setup (5 min)

```bash
# 1. Enable Firebase
gcloud services enable firebase.googleapis.com --project=osi-card

# 2. Initialize Firebase in project
npm install -g firebase-tools
firebase login
firebase init hosting --project=osi-card
```

### Phase 2: Configure Firebase Hosting

Create `firebase.json`:

```json
{
  "hosting": {
    "public": "dist/osi-cards/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

### Phase 3: Build & Deploy Script

Add to `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run build:prod && firebase deploy --only hosting",
    "deploy:preview": "npm run build:prod && firebase hosting:channel:deploy preview"
  }
}
```

### Phase 4: CI/CD with Cloud Build

Create `cloudbuild.yaml`:

```yaml
steps:
  # Install dependencies
  - name: 'node:20'
    entrypoint: npm
    args: ['ci']

  # Build production
  - name: 'node:20'
    entrypoint: npm
    args: ['run', 'build:prod']

  # Deploy to Firebase
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: bash
    args:
      - '-c'
      - |
        npm install -g firebase-tools
        firebase deploy --only hosting --project=osi-card --token=$$FIREBASE_TOKEN

options:
  logging: CLOUD_LOGGING_ONLY

substitutions:
  _FIREBASE_TOKEN: ''

availableSecrets:
  secretManager:
    - versionName: projects/osi-card/secrets/firebase-token/versions/latest
      env: 'FIREBASE_TOKEN'
```

### Phase 5: Custom Domain (Optional)

```bash
# Add custom domain
firebase hosting:channel:create production
firebase hosting:sites:create osi-cards-eu
firebase target:apply hosting osi-cards osi-cards-eu
```

---

## Deployment Commands

### Quick Deploy (Manual)

```bash
# One-time setup
npm install -g firebase-tools
firebase login
firebase init hosting --project=osi-card

# Deploy
npm run build:prod
firebase deploy --only hosting
```

### Automated Deploy (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build:prod

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: osi-card
```

---

## Performance Optimizations (Already Configured)

✅ Service Worker (PWA) - `ngsw-config.json`  
✅ Lazy loading routes  
✅ Pre-rendered documentation  
✅ Asset caching headers  
✅ Gzip/Brotli compression (Firebase auto)

---

## Monitoring

```bash
# View hosting usage
firebase hosting:usage

# View logs
firebase functions:log
```

---

## Alternative: Cloud Run (If API Needed Later)

If you need server-side features later:

```bash
# Build container
gcloud builds submit --tag europe-west1-docker.pkg.dev/osi-card/osi-cards/app

# Deploy to Cloud Run
gcloud run deploy osi-cards \
  --image europe-west1-docker.pkg.dev/osi-card/osi-cards/app \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --memory 256Mi \
  --cpu 1
```

**Cloud Run Cost**: ~€0.50/month for minimal traffic (scales to zero)

---

## Summary

| Option               | Cost    | Complexity | Best For           |
| -------------------- | ------- | ---------- | ------------------ |
| **Firebase Hosting** | €0      | Low        | Static SPA ✅      |
| Cloud Storage + LB   | €5-10   | Medium     | High customization |
| Cloud Run            | €0.50-5 | Medium     | SSR/API needed     |

**Recommendation**: Start with **Firebase Hosting** - it's free, fast, and perfect for your Angular SPA with low traffic.

