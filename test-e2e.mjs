// e2e test using Playwright
import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

async function apiFetch(method, path, body, headers = {}) {
  const result = await page.evaluate(async ({ method, url, body, headers }) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const json = await res.json();
    return { status: res.status, data: json };
  }, { method, url: `${BASE}${path}`, body, headers });
  return result;
}

async function apiAuth(method, path, body, token) {
  return apiFetch(method, path, body, { Authorization: `Bearer ${token}` });
}

// 1. Health check
await test('GET /health returns 200', async () => {
  const { status } = await apiFetch('GET', '/health');
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
});

// 2. Login with wrong password → 401
await test('POST /api/auth/login fails with wrong password', async () => {
  const { status } = await apiFetch('POST', '/api/auth/login', {
    username: 'admin', password: 'wrongpassword'
  });
  if (status !== 401) throw new Error(`expected 401, got ${status}`);
});

// 3. Login with correct password → token
let token = '';
await test('POST /api/auth/login succeeds with correct credentials', async () => {
  const { status, data } = await apiFetch('POST', '/api/auth/login', {
    username: 'admin', password: 'admin123'
  });
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (!data?.data?.token) throw new Error(`no token in response: ${JSON.stringify(data)}`);
  token = data.data.token;
  if (data.data.user?.username !== 'admin') throw new Error(`wrong username: ${data.data.user?.username}`);
  if (data.data.user?.roleCode !== 'ADMIN') throw new Error('wrong roleCode');
  console.log(`   Token: ${token.substring(0, 30)}...`);
});

// 4. Access protected route without token → 401
await test('GET /api/auth/me returns 401 without token', async () => {
  const { status } = await apiFetch('GET', '/api/auth/me');
  if (status !== 401) throw new Error(`expected 401, got ${status}`);
});

// 5. Authenticated /api/auth/me
await test('GET /api/auth/me returns user info with valid token', async () => {
  const { status, data } = await apiAuth('GET', '/api/auth/me', null, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (data.data?.username !== 'admin') throw new Error(`expected admin, got ${data.data?.username}`);
});

// 6. Order list pagination (uses records/page/size/total format)
await test('GET /api/order/orders returns paginated orders', async () => {
  const { status, data } = await apiAuth('GET', '/api/order/orders?page=1&pageSize=3', null, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (!Array.isArray(data.data?.records)) throw new Error(`records is not an array: ${JSON.stringify(data.data)}`);
  if (!data.data?.total) throw new Error('total missing');
  if (!data.data?.page) throw new Error('page missing');
});

// 7. Get order by ID
await test('GET /api/order/orders/:id returns order detail', async () => {
  const { status, data } = await apiAuth('GET', '/api/order/orders/2', null, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (!data.data?.id) throw new Error('order id missing');
  if (!data.data?.orderNo) throw new Error('orderNo missing');
});

// 8. Warehouse list
await test('GET /api/warehouse/warehouses returns warehouse list', async () => {
  const { status, data } = await apiAuth('GET', '/api/warehouse/warehouses?page=1&pageSize=5', null, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (!Array.isArray(data.data?.records)) throw new Error('records is not an array');
  if (data.data?.records?.length < 1) throw new Error('warehouse list should not be empty');
});

// 9. Transport drivers list
await test('GET /api/transport/drivers returns driver list', async () => {
  const { status, data } = await apiAuth('GET', '/api/transport/drivers?page=1&pageSize=5', null, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (!Array.isArray(data.data?.records)) throw new Error('records is not an array');
});

// 10. Transport vehicles list
await test('GET /api/transport/vehicles returns vehicle list', async () => {
  const { status, data } = await apiAuth('GET', '/api/transport/vehicles?page=1&pageSize=5', null, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (!Array.isArray(data.data?.records)) throw new Error('records is not an array');
});

// 11. Create order
await test('POST /api/order/orders creates a new order', async () => {
  const { status, data } = await apiAuth('POST', '/api/order/orders', {
    senderName: '测试发件人',
    senderPhone: '13800001111',
    senderAddress: '上海市浦东新区某路1号',
    receiverName: '测试收件人',
    receiverPhone: '13900002222',
    receiverAddress: '北京市朝阳区某街2号',
    totalAmount: 1500,
    remark: 'Playwright 测试订单'
  }, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (!data.data?.orderNo) throw new Error(`orderNo not generated: ${JSON.stringify(data)}`);
  console.log(`   Created order: ${data.data.orderNo}`);
});

// 12. Create warehouse
await test('POST /api/warehouse/warehouses creates a new warehouse', async () => {
  const ts = Date.now();
  const { status, data } = await apiAuth('POST', '/api/warehouse/warehouses', {
    code: `WH-TEST-${ts}`,
    name: '测试仓库',
    address: '上海市测试区',
    manager: '测试经理',
    phone: '13800000000',
    totalCapacity: 1000
  }, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}: ${JSON.stringify(data)}`);
  if (!data.data?.id) throw new Error('warehouse id not returned');
});

// 13. Create driver
await test('POST /api/transport/drivers creates a new driver', async () => {
  const { status, data } = await apiAuth('POST', '/api/transport/drivers', {
    name: '张测试司机',
    phone: '13800009999',
    licenseNo: '110101199001011234'
  }, token);
  if (status !== 200) throw new Error(`expected 200, got ${status}`);
  if (!data.data?.id) throw new Error('driver id not returned');
});

await browser.close();

console.log('\n=== Results ===');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
if (failed > 0) process.exit(1);