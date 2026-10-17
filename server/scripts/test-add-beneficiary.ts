async function testAddBeneficiary() {
  const base = 'http://localhost:5000/api';
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'aww_hansa', password: 'khorak123' }),
  });
  const { token, user } = await loginRes.json();
  const awcId = user.awc.id;

  const createRes = await fetch(`${base}/thr/beneficiaries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      awcId,
      fullNameEn: 'Priya Solanki',
      fullNameGu: 'પ્રિયા સોલંકી',
      category: 'CHILD_0_TO_3',
      guardianName: 'Gitaben Solanki',
      dateOfBirth: '2025-02-10T00:00:00.000Z',
      gender: 'FEMALE',
    }),
  });

  const resJson = await createRes.json();
  console.log('Status:', createRes.status);
  console.log('Created Beneficiary:', resJson.beneficiary);

  // Verify list
  const listRes = await fetch(`${base}/thr/beneficiaries/${awcId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listJson = await listRes.json();
  console.log('Total enrolled beneficiaries in AWC:', listJson.beneficiaries.length);
  const found = listJson.beneficiaries.find((b: any) => b.id === resJson.beneficiary.id);
  console.log('Newly added beneficiary in roster:', found ? 'YES' : 'NO');
}

testAddBeneficiary().catch(console.error);
