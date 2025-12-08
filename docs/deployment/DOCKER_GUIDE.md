# 🐳 Docker Deployment Guide

Complete guide for deploying OSI Cards using Docker.

---

## 🚀 Quick Start

### Build and Run

```bash
# Build the image
docker build -t osi-cards:latest .

# Run the container
docker run -d -p 4200:80 --name osi-cards osi-cards:latest
```

Access the app at: `http://localhost:4200`

---

## 📦 Docker Compose

### Production

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Development

```bash
# Start in development mode
docker-compose --profile dev up

# This will:
# - Mount your local directory
# - Install dependencies
# - Start the dev server with hot reload
```

---

## 🏗️ Multi-Stage Build

Our Dockerfile uses a multi-stage build for optimal size:

```
Stage 1 (builder): ~1.2GB
├── Node.js 20
├── Build dependencies
└── Compiled application

Stage 2 (production): ~25MB
├── Nginx Alpine
└── Static files only
```

**Size Reduction:** 95% smaller final image!

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```bash
# Application
NODE_ENV=production
APP_VERSION=1.5.5

# API Configuration
API_BASE_URL=https://api.example.com

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_SERVICE_WORKER=true
```

### Custom Nginx Config

Modify `nginx.conf` to customize:
- Caching policies
- Security headers
- Compression settings
- Proxy configurations

---

## 🔒 Security

### Security Headers

The nginx.conf includes:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`

### Best Practices

1. **Use specific image versions**
   ```dockerfile
   FROM node:20.10.0-alpine
   ```

2. **Run as non-root user**
   ```dockerfile
   USER nginx
   ```

3. **Scan for vulnerabilities**
   ```bash
   docker scan osi-cards:latest
   ```

---

## 📊 Health Checks

### Application Health

```bash
# Check health status
curl http://localhost:4200/health

# Docker health check
docker inspect --format='{{.State.Health.Status}}' osi-cards
```

### Monitoring

Health checks run every 30 seconds:
- **Healthy:** Application responding
- **Unhealthy:** Container will restart
- **Starting:** Initializing (40s grace period)

---

## 🚢 Deployment

### Docker Hub

```bash
# Tag the image
docker tag osi-cards:latest username/osi-cards:1.5.5

# Push to Docker Hub
docker push username/osi-cards:1.5.5
```

### AWS ECS

```bash
# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Deploy service
aws ecs update-service --cluster osi-cards --service osi-cards-service --force-new-deployment
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: osi-cards
spec:
  replicas: 3
  selector:
    matchLabels:
      app: osi-cards
  template:
    metadata:
      labels:
        app: osi-cards
    spec:
      containers:
      - name: osi-cards
        image: osi-cards:latest
        ports:
        - containerPort: 80
```

---

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs osi-cards

# Inspect container
docker inspect osi-cards

# Check nginx config
docker exec osi-cards nginx -t
```

### Build Fails

```bash
# Clear build cache
docker build --no-cache -t osi-cards:latest .

# Check disk space
docker system df

# Clean up
docker system prune
```

### Performance Issues

```bash
# Check resource usage
docker stats osi-cards

# Limit resources
docker run -d -m 512m --cpus 1 osi-cards:latest
```

---

## 📈 Optimization

### Build Performance

```dockerfile
# Use layer caching
COPY package*.json ./
RUN npm ci
COPY . .
```

### Runtime Performance

```nginx
# Enable gzip
gzip on;
gzip_types text/css application/javascript;

# Cache static assets
location ~* \.(js|css|png|jpg)$ {
  expires 1y;
}
```

---

## 🧪 Testing

### Test the Build

```bash
# Build
docker build -t osi-cards:test .

# Run tests in container
docker run --rm osi-cards:test npm test

# Check size
docker images osi-cards:test
```

### Integration Tests

```bash
# Start container
docker-compose up -d

# Wait for healthy
until [ "$(docker inspect -f {{.State.Health.Status}} osi-cards-app)" == "healthy" ]; do
  sleep 1
done

# Run tests
npm run test:e2e
```

---

## 📚 Additional Resources

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Last Updated:** December 4, 2025
**Docker Version:** 24.0+
**Status:** Production Ready 🐳








