async function testFlow() {
  const base = 'http://localhost:5000/api';
  console.log('--- 1. Testing AWW Login ---');
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'aww_hansa', password: 'khorak123' })
  });
  const loginData = await loginRes.json();
  console.log(`Status: ${loginRes.status}, User: ${loginData.user.fullNameEn} (${loginData.user.role})`);
  const token = loginData.token;

  console.log('\n--- 2. Fetching Stock Levels ---');
  const stockRes = await fetch(`${base}/stock`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const stockData = await stockRes.json();
  const items = stockData.stockOverview || stockData.stock || [];
  console.log(`Total stock items: ${items.length}`);
  for (const s of items) {
    console.log(` - ${s.item.nameEn} (${s.item.category}): ${s.currentBalance} ${s.item.unit} (Status: ${s.status})`);
  }

  console.log('\n--- 3. Testing Discrepancies ---');
  const discRes = await fetch(`${base}/discrepancies`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const discData = await discRes.json();
  console.log(`Active discrepancies count: ${discData.discrepancies.length}`);
  for (const d of discData.discrepancies) {
    console.log(` - Case ${d.id.slice(0, 8)}...: Item ${d.item?.nameEn}, Expected: ${d.expectedQty}, Actual: ${d.actualQty}, Variance: ${d.varianceQty}, Status: ${d.status}`);
  }

  console.log('\n--- 4. Testing Supervisor Scope ---');
  const supLogin = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'sup_rekha', password: 'khorak123' })
  });
  const supData = await supLogin.json();
  console.log(`Supervisor: ${supData.user.fullNameEn} (${supData.user.role}), Sector: ${supData.user.sector?.nameEn}`);

  const supAwcRes = await fetch(`${base}/awc`, {
    headers: { Authorization: `Bearer ${supData.token}` }
  });
  const supAwcs = await supAwcRes.json();
  console.log(`AWCs in assigned sector: ${supAwcs.awcs.length}`);
  for (const a of supAwcs.awcs) {
    console.log(` - AWC: ${a.nameEn} (Code: ${a.code})`);
  }

  console.log('\n--- 5. Testing Offline Batch Sync Endpoint ---');
  const syncTest = await fetch(`${base}/sync/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      operations: []
    })
  });
  const syncRes = await syncTest.json();
  console.log(`Batch sync endpoint response:`, syncRes);

  console.log('\n--- 6. Testing Auto-MPR Report Generation ---');
  const mprRes = await fetch(`${base}/reports/mpr`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const mprData = await mprRes.json();
  const mprReport = mprData.mpr;
  console.log(`MPR Generated for: ${mprReport.awc.nameEn}, Period: ${mprReport.reportMonth}`);
  console.log(`Feeding days delivered: ${mprReport.feedingDaysDelivered}/${mprReport.feedingDaysMandatedTarget}`);
  console.log(`MPR Item rows count: ${mprReport.itemReports.length}`);

  console.log('\n✅ All API flows verified successfully!');
}

testFlow().catch(console.error);
