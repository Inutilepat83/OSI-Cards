/**
 * K6 Load Test Script
 *
 * Run with: k6 run k6-load-test.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failures
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4200';

export default function () {
  // Test homepage
  let res = http.get(BASE_URL);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'page loads': (r) => r.body.includes('OSI Cards'),
  });

  sleep(1);

  // Test documentation page
  res = http.get(`${BASE_URL}/docs`);
  check(res, {
    'docs loads': (r) => r.status === 200,
  });

  sleep(1);

  // Test API page
  res = http.get(`${BASE_URL}/api`);
  check(res, {
    'api loads': (r) => r.status === 200,
  });

  sleep(1);
}

// Setup function (runs once)
export function setup() {
  console.log('Starting load test...');
  return { startTime: Date.now() };
}

// Teardown function (runs once)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration}s`);
}








