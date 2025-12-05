# ☸️ Kubernetes Deployment

Complete Kubernetes configuration for OSI Cards.

---

## 🚀 Quick Deploy

```bash
# Apply all configurations
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

---

## 📦 Components

### 1. Deployment (`deployment.yaml`)
- **Replicas:** 3 (high availability)
- **Strategy:** Rolling update (zero downtime)
- **Resources:** 128Mi-256Mi RAM, 100m-500m CPU
- **Health Checks:** Liveness & readiness probes

### 2. Service (`service.yaml`)
- **Type:** LoadBalancer
- **Port:** 80
- **Selector:** app=osi-cards

### 3. Ingress (`ingress.yaml`)
- **TLS:** Automatic HTTPS with cert-manager
- **Hosts:** osi-cards.com, www.osi-cards.com
- **SSL Redirect:** Forced HTTPS

### 4. HPA (`hpa.yaml`)
- **Min Replicas:** 3
- **Max Replicas:** 10
- **CPU Target:** 70%
- **Memory Target:** 80%

### 5. ConfigMap (`configmap.yaml`)
- Environment variables
- Feature flags
- API configuration

---

## 🔧 Configuration

### Update Image Version

```bash
# Edit deployment.yaml
image: osi-cards:1.5.6

# Apply changes
kubectl apply -f k8s/deployment.yaml

# Or use kubectl set
kubectl set image deployment/osi-cards osi-cards=osi-cards:1.5.6
```

### Scale Manually

```bash
# Scale to 5 replicas
kubectl scale deployment osi-cards --replicas=5

# Auto-scaling is configured via HPA
```

### Update Configuration

```bash
# Edit configmap.yaml
kubectl apply -f k8s/configmap.yaml

# Restart pods to pick up changes
kubectl rollout restart deployment/osi-cards
```

---

## 📊 Monitoring

### Check Status

```bash
# Deployment status
kubectl get deployments

# Pod status
kubectl get pods -l app=osi-cards

# Service status
kubectl get services

# HPA status
kubectl get hpa
```

### View Logs

```bash
# All pods
kubectl logs -l app=osi-cards --tail=100

# Specific pod
kubectl logs osi-cards-xxx-yyy -f

# Previous container (if crashed)
kubectl logs osi-cards-xxx-yyy --previous
```

### Describe Resources

```bash
# Deployment details
kubectl describe deployment osi-cards

# Pod details
kubectl describe pod osi-cards-xxx-yyy

# Events
kubectl get events --sort-by='.lastTimestamp'
```

---

## 🔄 Updates & Rollbacks

### Rolling Update

```bash
# Update image
kubectl set image deployment/osi-cards osi-cards=osi-cards:1.5.6

# Watch rollout
kubectl rollout status deployment/osi-cards

# Pause rollout (if issues)
kubectl rollout pause deployment/osi-cards

# Resume rollout
kubectl rollout resume deployment/osi-cards
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/osi-cards

# Rollback to specific revision
kubectl rollout undo deployment/osi-cards --to-revision=2

# View rollout history
kubectl rollout history deployment/osi-cards
```

---

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods

# Describe pod
kubectl describe pod osi-cards-xxx-yyy

# Check events
kubectl get events

# Common issues:
# - Image pull errors
# - Resource limits
# - Health check failures
```

### Service Not Accessible

```bash
# Check service
kubectl get svc osi-cards

# Check endpoints
kubectl get endpoints osi-cards

# Test from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://osi-cards
```

### High Memory/CPU

```bash
# Check resource usage
kubectl top pods -l app=osi-cards

# Increase limits in deployment.yaml
resources:
  limits:
    memory: "512Mi"
    cpu: "1000m"
```

---

## 🔒 Security

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: osi-cards-network-policy
spec:
  podSelector:
    matchLabels:
      app: osi-cards
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: ingress
    ports:
    - protocol: TCP
      port: 80
```

### Secrets Management

```bash
# Create secret
kubectl create secret generic osi-cards-secrets \
  --from-literal=api-key=xxx \
  --from-literal=db-password=yyy

# Use in deployment
env:
- name: API_KEY
  valueFrom:
    secretKeyRef:
      name: osi-cards-secrets
      key: api-key
```

---

## 📈 Scaling

### Manual Scaling

```bash
# Scale up
kubectl scale deployment osi-cards --replicas=5

# Scale down
kubectl scale deployment osi-cards --replicas=2
```

### Auto-Scaling (HPA)

HPA automatically scales based on:
- CPU usage (70% target)
- Memory usage (80% target)
- Min: 3 replicas
- Max: 10 replicas

---

## 🎯 Best Practices

1. **Always use health checks**
2. **Set resource limits**
3. **Use rolling updates**
4. **Enable auto-scaling**
5. **Monitor continuously**
6. **Have rollback plan**
7. **Use namespaces**
8. **Implement network policies**

---

**Last Updated:** December 4, 2025
**Kubernetes Version:** 1.28+
**Status:** Production Ready ☸️


