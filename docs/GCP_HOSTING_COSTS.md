# GCP Hosting Cost Analysis for OSI Cards

## Application Overview

**OSI Cards** is an Angular 20 Single Page Application (SPA) that can operate in multiple modes:
- **Static mode**: Uses JSON files from `assets/configs/` (no backend required)
- **API mode**: Optional API calls to external endpoints
- **WebSocket mode**: Optional real-time updates via WebSocket connections

The application includes:
- Service Worker (PWA support)
- Angular Service Worker for offline capability
- Static assets (fonts, images, JSON configs)
- Estimated bundle size: 2-5MB (based on angular.json budgets)

---

## Recommended Hosting Options & Costs

### Option 1: Cloud Storage + Cloud CDN ⭐ **MOST COST-EFFECTIVE**

**Best for**: Static hosting only, no server-side requirements

#### Architecture
- **Cloud Storage**: Host static HTML/CSS/JS files
- **Cloud CDN**: Global content delivery
- **Cloud Load Balancer**: HTTPS endpoint (optional but recommended)

#### Monthly Cost Breakdown (Low Traffic: ~10,000 requests/month)

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Storage** | 100 MB storage | $0.002/month |
| | 10,000 GET requests | $0.004/month |
| **Cloud CDN** | 10 GB egress | $0.000/month* |
| **Cloud Load Balancer** | 1 forwarding rule (always on) | $18/month |
| **SSL Certificate** | Managed certificate | $0/month (included) |
| **DNS** | Cloud DNS (if needed) | $0.20/month |
| **Total** | | **~$18-20/month** |

*First 1TB/month is free for Cloud CDN egress from Cloud Storage

#### Monthly Cost Breakdown (Medium Traffic: ~100,000 requests/month)

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Storage** | 100 MB storage | $0.002/month |
| | 100,000 GET requests | $0.04/month |
| **Cloud CDN** | 100 GB egress | $0.000/month* |
| **Cloud Load Balancer** | 1 forwarding rule | $18/month |
| **DNS** | Cloud DNS | $0.20/month |
| **Total** | | **~$18-20/month** |

#### Monthly Cost Breakdown (High Traffic: ~1M requests/month, 1TB egress)

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Storage** | 500 MB storage | $0.01/month |
| | 1M GET requests | $0.40/month |
| **Cloud CDN** | 1 TB egress | $0.00/month* |
| **Cloud Load Balancer** | 1 forwarding rule | $18/month |
| **DNS** | Cloud DNS | $0.20/month |
| **Total** | | **~$18-20/month** |

**Note**: The load balancer is the main cost driver at $18/month. For lower cost, you could use Cloud Storage's website hosting directly, but it only supports HTTP (not recommended for production).

#### Setup Complexity: ⭐⭐⭐ (Medium)

---

### Option 2: Firebase Hosting ⭐ **EASIEST + COST-EFFECTIVE**

**Best for**: Static hosting with easy CI/CD integration, global CDN included

#### Architecture
- **Firebase Hosting**: Static hosting with built-in CDN
- **Cloud Functions**: Optional for API/WebSocket (if needed)
- **Firebase Storage**: For additional assets (if needed)

#### Monthly Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| **Firebase Hosting** | 10 GB storage | Free |
| | 360 MB/day bandwidth (10.8 GB/month) | Free |
| | SSL, CDN, Custom Domain | Free |
| **Total (Free Tier)** | | **$0/month** |

#### Pricing Beyond Free Tier

| Usage | Cost |
|-------|------|
| Storage: First 10 GB | Free |
| Storage: Additional | $0.026/GB/month |
| Bandwidth: First 360 MB/day (10.8 GB/month) | Free |
| Bandwidth: Additional | $0.15/GB (first 1 TB) |
| Bandwidth: Additional | $0.12/GB (1-10 TB) |

#### Example: High Traffic (50 GB/month bandwidth, 20 GB storage)

| Service | Usage | Cost |
|---------|-------|------|
| Storage | 20 GB | $0.26/month |
| Bandwidth | 50 GB (10.8 GB free) | $5.88/month |
| **Total** | | **~$6-7/month** |

#### Setup Complexity: ⭐ (Very Easy)

**Pros**:
- Easy deployment with `firebase deploy`
- Built-in CI/CD integration
- Free SSL certificates
- Global CDN included
- Preview channels for PRs
- Free tier is generous

---

### Option 3: Cloud Run (Containerized)

**Best for**: Need server-side functionality, API endpoints, or SSR

#### Architecture
- **Cloud Run**: Containerized service (can serve static files via nginx)
- **Cloud Build**: Build and deploy (optional)

#### Monthly Cost Breakdown (Low Traffic: 100K requests, 0.5 CPU-hours)

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Run** | 2 vCPU, 512 MB RAM | $0.00002400/vCPU-second |
| | 100K requests | $0.0004/request (first 2M free) |
| | 0.5 CPU-hours/month | $0.43/month |
| | Memory: 512 MB | $0.00000250/GB-second |
| | Bandwidth: 10 GB egress | $0.12/GB = $1.20/month |
| **Cloud Build** (optional) | 120 build-minutes | Free (first 120 min/day) |
| **Total** | | **~$1.50-2/month** |

#### Monthly Cost Breakdown (Medium Traffic: 1M requests, 10 CPU-hours)

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Run** | 10 CPU-hours | $8.64/month |
| | 1M requests | $400/month* |
| | Memory: 512 MB | $3.00/month |
| | Bandwidth: 100 GB | $12/month |
| **Total** | | **~$420-450/month** |

*First 2 million requests/month are FREE

**Note**: Cloud Run is pay-per-use. Idle time doesn't cost anything.

#### Setup Complexity: ⭐⭐⭐⭐ (High - requires Docker/containerization)

---

### Option 4: App Engine (Standard Environment)

**Best for**: Traditional PaaS, automatic scaling

#### Monthly Cost Breakdown (Low Traffic: F1 instance)

| Service | Usage | Cost |
|---------|-------|------|
| **App Engine** | F1 instance (0.6 GB RAM) | $0.05/hour = $36/month* |
| | 28 instance-hours/day | |
| | Bandwidth: 10 GB | $0.12/GB = $1.20/month |
| **Total** | | **~$37-40/month** |

*28 hours/day = automatic scaling, typical for low traffic

#### Setup Complexity: ⭐⭐⭐ (Medium - requires app.yaml)

---

### Option 5: Compute Engine (Virtual Machine)

**Best for**: Full control, custom server configuration

#### Monthly Cost Breakdown (e2-micro instance)

| Service | Usage | Cost |
|---------|-------|------|
| **Compute Engine** | e2-micro (1 vCPU, 1 GB RAM) | ~$7/month |
| | 30 GB SSD persistent disk | $4.50/month |
| | Bandwidth: 10 GB egress | $0.12/GB = $1.20/month |
| | Static IP (if needed) | $1.46/month |
| **Total** | | **~$14-16/month** |

#### Monthly Cost Breakdown (e2-small for higher traffic)

| Service | Usage | Cost |
|---------|-------|------|
| **Compute Engine** | e2-small (2 vCPU, 2 GB RAM) | ~$14/month |
| | 50 GB SSD | $7.50/month |
| | Bandwidth: 100 GB | $12/month |
| | Static IP | $1.46/month |
| **Total** | | **~$35-40/month** |

#### Setup Complexity: ⭐⭐⭐⭐⭐ (Very High - requires server management)

---

## Cost Comparison Summary

| Option | Low Traffic | Medium Traffic | High Traffic | Setup Difficulty |
|--------|-------------|----------------|--------------|------------------|
| **Cloud Storage + CDN** | $18-20/month | $18-20/month | $18-20/month | Medium |
| **Firebase Hosting** | $0/month | $6-7/month | $20-50/month | Very Easy |
| **Cloud Run** | $1.50-2/month | $10-20/month | $50-200/month | High |
| **App Engine** | $37-40/month | $50-100/month | $100-300/month | Medium |
| **Compute Engine** | $14-16/month | $35-40/month | $100-200/month | Very High |

---

## Recommendations by Use Case

### 🎯 **Best Overall Choice: Firebase Hosting**
- **Cost**: Free for low/medium traffic
- **Ease**: Simplest deployment
- **Features**: Built-in CDN, SSL, preview channels
- **Best for**: Most static Angular SPAs

### 💰 **Lowest Cost (with custom domain/HTTPS): Cloud Storage + CDN**
- **Cost**: ~$18/month fixed (load balancer required for HTTPS)
- **Best for**: Predictable costs, high traffic

### 🚀 **If You Need Backend: Cloud Run**
- **Cost**: Pay-per-use, very cheap for low traffic
- **Best for**: API endpoints, WebSocket server, SSR

### 🏢 **Enterprise/Complex: App Engine**
- **Cost**: Higher fixed costs
- **Best for**: Complex applications, automatic scaling needs

---

## Additional Considerations

### 1. **API Backend Costs** (if needed)
If you need to host the API backend separately:
- **Cloud Run**: $0-20/month for low traffic
- **Cloud Functions**: $0/month (first 2M invocations free)
- **API Gateway**: $3/month base + usage

### 2. **WebSocket Server** (if using WebSocket provider)
- **Cloud Run**: Can handle WebSocket (pay-per-use)
- **Compute Engine**: Fixed cost option
- **Firebase Realtime Database**: Alternative for real-time features

### 3. **Domain & DNS**
- **Cloud DNS**: $0.20/month per zone + $0.40 per million queries
- **Google Domains**: Domain registration ($12/year typical)

### 4. **Monitoring & Logging**
- **Cloud Logging**: First 50 GB/month free
- **Cloud Monitoring**: Free tier available
- **Error Reporting**: Free tier available

### 5. **CI/CD**
- **Cloud Build**: 120 build-minutes/day free
- **GitHub Actions**: Free for public repos, included in GitHub plans
- **Cloud Source Repositories**: Free for private repos (limited)

---

## Estimated Total Costs

### Scenario 1: Static Only (No Backend)
- **Firebase Hosting**: $0-10/month
- **Domain**: $1/month (annualized)
- **Total**: **~$1-11/month**

### Scenario 2: Static + API Backend
- **Firebase Hosting**: $0-10/month
- **Cloud Run** (API): $5-20/month
- **Domain**: $1/month
- **Total**: **~$6-31/month**

### Scenario 3: Static + WebSocket Server
- **Cloud Storage + CDN**: $18/month
- **Cloud Run** (WebSocket): $10-50/month
- **Domain**: $1/month
- **Total**: **~$29-69/month**

### Scenario 4: Full Stack (Static + API + WebSocket + Database)
- **Firebase Hosting**: $0-10/month
- **Cloud Run**: $20-100/month
- **Cloud SQL** (PostgreSQL): $25-50/month
- **Domain**: $1/month
- **Total**: **~$46-161/month**

---

## Free Tier Benefits

### Always Free (no expiration)
- **Cloud Storage**: 5 GB standard storage
- **Cloud Functions**: 2M invocations/month, 400K GB-seconds
- **Firebase Hosting**: 10 GB storage, 360 MB/day bandwidth
- **Cloud Logging**: 50 GB/month
- **Cloud CDN**: 1 TB egress/month (from Cloud Storage)
- **Cloud Build**: 120 build-minutes/day

### $300 Free Trial Credit
- Valid for 90 days
- Can cover initial setup and testing
- Covers most services

---

## Cost Optimization Tips

1. **Use Firebase Hosting** for static files (free tier is generous)
2. **Enable Cloud CDN** to reduce egress costs
3. **Use Cloud Functions** for simple API endpoints (2M invocations free)
4. **Monitor usage** with Cloud Monitoring to avoid surprises
5. **Set up billing alerts** to prevent unexpected charges
6. **Use Cloud Storage lifecycle policies** to archive old files
7. **Enable compression** to reduce bandwidth usage
8. **Cache aggressively** to reduce API calls

---

## Next Steps

1. **Choose a hosting option** based on your requirements
2. **Set up billing alerts** in GCP Console
3. **Use the free tier** during development/testing
4. **Monitor costs** regularly using Cloud Billing
5. **Optimize** based on actual usage patterns

---

## Resources

- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [Firebase Hosting Pricing](https://firebase.google.com/pricing)
- [Cloud Storage Pricing](https://cloud.google.com/storage/pricing)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Free Tier Details](https://cloud.google.com/free)

---

**Last Updated**: Based on GCP pricing as of 2025. Prices are subject to change. Always check the official GCP pricing pages for the most current rates.

