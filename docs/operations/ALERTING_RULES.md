# 🚨 Alerting Rules

**Version:** 1.0
**Last Updated:** December 4, 2025
**Status:** Active

---

## 🎯 Alerting Philosophy

**Goals:**
1. Detect issues before users notice
2. Alert on actionable items only
3. Minimize alert fatigue
4. Provide clear remediation steps

**Principles:**
- Alert on symptoms, not causes
- Include context in alerts
- Route to appropriate team
- Escalate if not resolved

---

## 🚨 Alert Severity Levels

### Critical (P0) 🔴
**Response Time:** 15 minutes
**Escalation:** Immediate
**Notification:** SMS + Phone + Slack

**Triggers:**
- Application completely down
- Data corruption detected
- Security breach
- 5xx error rate > 10%
- Uptime < 99%

### High (P1) 🟠
**Response Time:** 1 hour
**Escalation:** After 30 minutes
**Notification:** Slack + Email

**Triggers:**
- Major feature broken
- 5xx error rate > 5%
- Response time > 2s (p95)
- Memory usage > 90%
- CPU usage > 80%

### Medium (P2) 🟡
**Response Time:** 4 hours
**Escalation:** After 8 hours
**Notification:** Slack

**Triggers:**
- Minor feature broken
- 4xx error rate > 10%
- Response time > 1s (p95)
- Memory usage > 75%
- Disk usage > 80%

### Low (P3) 🟢
**Response Time:** 24 hours
**Escalation:** None
**Notification:** Slack (silent)

**Triggers:**
- Performance degradation
- Warning logs increased
- Disk usage > 60%
- Cache hit rate < 80%

---

## 📊 Specific Alert Rules

### 1. Application Availability

```yaml
alert: ApplicationDown
expr: up{job="osi-cards"} == 0
for: 1m
severity: critical
message: "OSI Cards application is down"
action: "Check pods: kubectl get pods -l app=osi-cards"
```

```yaml
alert: HighErrorRate
expr: error_rate > 0.05
for: 5m
severity: high
message: "Error rate above 5%"
action: "Check error logs and recent deployments"
```

### 2. Performance

```yaml
alert: SlowResponseTime
expr: http_response_time_p95 > 1000
for: 10m
severity: medium
message: "P95 response time > 1s"
action: "Check APM dashboard and database queries"
```

```yaml
alert: HighLatency
expr: request_latency_p99 > 2000
for: 10m
severity: high
message: "P99 latency > 2s"
action: "Investigate slow queries and optimize"
```

### 3. Resource Usage

```yaml
alert: HighMemoryUsage
expr: memory_usage_percent > 90
for: 5m
severity: high
message: "Memory usage > 90%"
action: "Check for memory leaks, restart if necessary"
```

```yaml
alert: HighCPUUsage
expr: cpu_usage_percent > 80
for: 10m
severity: medium
message: "CPU usage > 80%"
action: "Check for CPU-intensive operations"
```

```yaml
alert: DiskSpaceLow
expr: disk_usage_percent > 85
for: 15m
severity: medium
message: "Disk usage > 85%"
action: "Clean up logs and old files"
```

### 4. Health Checks

```yaml
alert: HealthCheckFailing
expr: health_check_status != "up"
for: 3m
severity: critical
message: "Health check failing"
action: "Investigate service health"
```

```yaml
alert: ServiceDegraded
expr: health_check_status == "degraded"
for: 10m
severity: medium
message: "Service in degraded state"
action: "Check dependent services"
```

### 5. Business Metrics

```yaml
alert: NoUserActivity
expr: active_users == 0
for: 30m
severity: medium
message: "No active users detected"
action: "Check if application is accessible"
```

```yaml
alert: UnusualTrafficPattern
expr: requests_per_minute > avg_over_time(requests_per_minute[1h]) * 3
for: 10m
severity: medium
message: "Unusual traffic pattern detected"
action: "Check for DDoS or bot traffic"
```

---

## 📞 Alert Routing

### By Severity

| Severity | On-Call | Team Channel | Email | SMS/Phone |
|----------|---------|--------------|-------|-----------|
| Critical | Yes | Yes | Yes | Yes |
| High | Yes | Yes | Yes | No |
| Medium | No | Yes | No | No |
| Low | No | Yes | No | No |

### By Time

| Time | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| Business Hours (9-5) | Immediate | Immediate | Batched | Batched |
| After Hours | Immediate | 1hr delay | Next day | Next day |
| Weekends | Immediate | 2hr delay | Monday | Monday |

### By Component

| Component | Primary | Secondary | Escalation |
|-----------|---------|-----------|------------|
| Frontend | Frontend Team | DevOps | CTO |
| API | Backend Team | DevOps | CTO |
| Database | DBA | DevOps | CTO |
| Infrastructure | DevOps | SRE | CTO |

---

## 🔔 Alert Channels

### Slack
- Channel: `#osi-cards-alerts`
- Critical: @here mention
- High: @channel mention
- Medium/Low: Regular message

### PagerDuty
- Service: osi-cards-production
- Escalation Policy: Standard
- On-Call Schedule: 24/7 rotation

### Email
- Distribution List: osi-cards-team@company.com
- Critical Only: c-level@company.com

---

## 🎯 Alert Best Practices

### Creating Alerts

1. **Be Specific**
   ```
   ❌ "Something is wrong"
   ✅ "API response time (P95) > 1s for 10 minutes"
   ```

2. **Include Context**
   - Current value
   - Threshold
   - Duration
   - Affected component

3. **Provide Action Items**
   - What to check
   - How to investigate
   - Possible remediation

4. **Set Appropriate Thresholds**
   - Not too sensitive (noise)
   - Not too late (impact)
   - Based on SLA targets

### Managing Alerts

1. **Acknowledge Promptly**
   - Within response time SLA
   - Update status
   - Communicate with team

2. **Investigate Thoroughly**
   - Check logs
   - Review metrics
   - Identify root cause

3. **Remediate**
   - Fix issue
   - Document solution
   - Update runbook

4. **Post-Mortem (if critical)**
   - What happened
   - Why it happened
   - How to prevent

---

## 📈 Alert Metrics

### Track Alert Quality

- **True Positives:** Alerts that correctly identified issues
- **False Positives:** Alerts that were not actual issues
- **Alert Fatigue Score:** Number of low-value alerts

**Goals:**
- True Positive Rate: > 90%
- False Positive Rate: < 10%
- Average Resolution Time: < SLA

### Monthly Review

- Review all alerts
- Tune thresholds
- Remove noisy alerts
- Add missing alerts

---

## 🛠️ Implementation

### Prometheus AlertManager
```yaml
route:
  receiver: 'slack'
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h

  routes:
  - match:
      severity: critical
    receiver: 'pagerduty'
    continue: true
```

### Application Code
```typescript
// Trigger alert
alertingService.critical(
  'Database Connection Failed',
  'Unable to connect to database',
  { host: 'db.example.com', attempts: 3 }
);
```

---

## 🎓 Runbooks

### Database Connection Failed
1. Check database status: `kubectl get pods -l app=postgres`
2. Check logs: `kubectl logs postgres-xxx`
3. Verify credentials
4. Check network connectivity
5. Restart if necessary

### High Memory Usage
1. Check pods: `kubectl top pods`
2. Check memory leaks in logs
3. Review recent deployments
4. Restart pod if needed
5. Scale horizontally if sustained

### API Response Slow
1. Check APM dashboard
2. Identify slow endpoints
3. Check database query times
4. Review recent changes
5. Optimize or scale

---

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║       🚨 ALERTING RULES: COMPLETE 🚨                     ║
║                                                           ║
║       ✅ 4 Severity Levels                               ║
║       ✅ 10+ Alert Rules                                 ║
║       ✅ Multi-channel Routing                           ║
║       ✅ Escalation Policies                             ║
║       ✅ Runbooks Included                               ║
║                                                           ║
║       Status: PRODUCTION READY 🚀                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

**Last Updated:** December 4, 2025
**Next Review:** Monthly
**Status:** Active








