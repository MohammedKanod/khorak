import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/db';
import { LedgerService } from '../src/services/ledgerService';

describe('KHORAK — Supply Chain & Accountability Automated Test Suite', () => {
  let awwToken: string;
  let supToken: string;
  let cdpoToken: string;
  let supplierToken: string;

  let vavdiAwcId: string;
  let nasirpurAwcId: string;
  let balshaktiItemId: string;
  let wheatItemId: string;

  beforeAll(async () => {
    // 1. Login as AWW
    const awwLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'aww_hansa', password: 'khorak123' });
    awwToken = awwLogin.body.token;
    vavdiAwcId = awwLogin.body.user.awcId;

    // 2. Login as Supervisor
    const supLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'sup_rekha', password: 'khorak123' });
    supToken = supLogin.body.token;

    // 3. Login as CDPO
    const cdpoLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'cdpo_mahesh', password: 'khorak123' });
    cdpoToken = cdpoLogin.body.token;

    // 4. Login as Supplier
    const suppLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'supplier_amul', password: 'khorak123' });
    supplierToken = suppLogin.body.token;

    // Get item IDs
    const itemsRes = await request(app)
      .get('/api/items')
      .set('Authorization', `Bearer ${awwToken}`);
    
    const balshakti = itemsRes.body.items.find((i: any) => i.code === 'THR-BAL-01');
    const wheat = itemsRes.body.items.find((i: any) => i.code === 'HCM-WHT-01');
    balshaktiItemId = balshakti.id;
    wheatItemId = wheat.id;

    const nasirpur = await prisma.aWC.findUnique({ where: { code: '24190103' } });
    nasirpurAwcId = nasirpur!.id;
  });

  it('1. Health check returns ONLINE with challenge metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.problemStatement).toBe('PS000052');
  });

  it('2. Scope isolation: AWW cannot read or mutate an unrelated AWC data', async () => {
    // Hansaben is assigned to Vavdi Buzarg, attempting to access Nasirpur
    const res = await request(app)
      .get(`/api/stock/awc/${nasirpurAwcId}`)
      .set('Authorization', `Bearer ${awwToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Scope violation');
  });

  it('3. Supplier cannot confirm an AWW physical receipt on AWW behalf', async () => {
    const res = await request(app)
      .post('/api/receipts/verify')
      .set('Authorization', `Bearer ${supplierToken}`)
      .send({
        awcId: vavdiAwcId,
        challanNumber: 'CH-UNAUTH-01',
        items: [{
          itemId: balshaktiItemId,
          quantityExpected: 50,
          quantityAccepted: 50,
          unit: 'PACKET',
        }],
      });

    expect(res.status).toBe(403);
  });

  it('4. Delivery Receipt: Only accepted quantity increases stock; Shortage triggers a Discrepancy case', async () => {
    const initialBal = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);

    // Supplier dispatches 100 packets, but AWW accepts 85, with 10 short and 5 damaged
    const verifyRes = await request(app)
      .post('/api/receipts/verify')
      .set('Authorization', `Bearer ${awwToken}`)
      .send({
        awcId: vavdiAwcId,
        challanNumber: `TEST-CHALLAN-${Date.now()}`,
        items: [
          {
            itemId: balshaktiItemId,
            quantityExpected: 100,
            quantityAccepted: 85, // ONLY 85 MUST ENTER STOCK!
            quantityShort: 10,   // Must trigger Discrepancy
            quantityDamaged: 5,  // Must trigger Discrepancy
            quantityRejected: 0,
            unit: 'PACKET',
            conditionStatus: 'SOME_DAMAGED',
            notes: 'Test delivery intake with shortages',
          },
        ],
      });

    expect(verifyRes.status).toBe(201);
    expect(verifyRes.body.discrepanciesCreated.length).toBeGreaterThanOrEqual(1);

    // Verify usable stock balance increased by EXACTLY 85 (NOT 100, NOT 95)
    const newBal = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);
    expect(newBal).toBe(initialBal + 85);

    // Verify open discrepancies exist for this receipt
    const discRes = await request(app)
      .get('/api/discrepancies?status=OPEN')
      .set('Authorization', `Bearer ${supToken}`);
    
    expect(discRes.status).toBe(200);
    const shortCase = discRes.body.discrepancies.find((d: any) => d.awcId === vavdiAwcId && d.discrepancyType === 'SHORT_DELIVERY');
    expect(shortCase).toBeDefined();
    expect(shortCase.varianceQuantity).toBe(-10);
  });

  it('5. THR Distribution reduces packet balance and leaves HCM ingredients unaffected', async () => {
    const balshaktiBefore = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);
    const wheatBefore = await LedgerService.getItemBalance(vavdiAwcId, wheatItemId);

    const distRes = await request(app)
      .post('/api/thr/distribute')
      .set('Authorization', `Bearer ${awwToken}`)
      .send({
        awcId: vavdiAwcId,
        distributionCycle: 'OCT-2026',
        distributions: [
          {
            beneficiaryCategory: 'CHILD_0_TO_3',
            itemId: balshaktiItemId,
            quantityDistributed: 4, // 4 packets
            acknowledgmentType: 'SCREEN_SIGNATURE',
          },
        ],
      });

    expect(distRes.status).toBe(201);

    const balshaktiAfter = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);
    const wheatAfter = await LedgerService.getItemBalance(vavdiAwcId, wheatItemId);

    // Balshakti reduced by 4
    expect(balshaktiAfter).toBe(balshaktiBefore - 4);
    // Wheat completely untouched
    expect(wheatAfter).toBe(wheatBefore);
  });

  it('6. HCM meal service consumes raw cooking ingredients, not THR stock', async () => {
    const balshaktiBefore = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);
    const wheatBefore = await LedgerService.getItemBalance(vavdiAwcId, wheatItemId);

    const hcmRes = await request(app)
      .post('/api/hcm/daily-service')
      .set('Authorization', `Bearer ${awwToken}`)
      .send({
        awcId: vavdiAwcId,
        enrolledChildren: 25,
        attendanceCount: 20,
        mealsPreparedCount: 20,
        mealsServedCount: 20,
        menuDescription: 'Wheat Sukhdi and Milk',
        ingredients: [
          {
            itemId: wheatItemId,
            quantityUsed: 2.5, // 2.5 kg wheat
            unit: 'KG',
          },
        ],
      });

    expect(hcmRes.status).toBe(201);
    expect(hcmRes.body.overReportFlag).toBe(false);

    const wheatAfter = await LedgerService.getItemBalance(vavdiAwcId, wheatItemId);
    const balshaktiAfter = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);

    // Wheat reduced by 2.5 kg
    expect(wheatAfter).toBe(Number((wheatBefore - 2.5).toFixed(3)));
    // Balshakti untouched
    expect(balshaktiAfter).toBe(balshaktiBefore);
  });

  it('7. Negative stock is strictly blocked when requesting more than available', async () => {
    const currentBal = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);

    const overDistRes = await request(app)
      .post('/api/thr/distribute')
      .set('Authorization', `Bearer ${awwToken}`)
      .send({
        awcId: vavdiAwcId,
        distributionCycle: 'OCT-2026',
        distributions: [
          {
            beneficiaryCategory: 'CHILD_0_TO_3',
            itemId: balshaktiItemId,
            quantityDistributed: currentBal + 5000, // Massive quantity
            acknowledgmentType: 'SCREEN_SIGNATURE',
          },
        ],
      });

    expect(overDistRes.status).toBe(400);
    expect(overDistRes.body.error).toContain('Insufficient stock');
  });

  it('8. Spoilage write-off does NOT alter stock before required approval', async () => {
    const balshaktiBefore = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);

    const wroRes = await request(app)
      .post('/api/write-off')
      .set('Authorization', `Bearer ${awwToken}`)
      .send({
        awcId: vavdiAwcId,
        itemId: balshaktiItemId,
        quantity: 2,
        unit: 'PACKET',
        reasonCode: 'RODENT_DAMAGE',
        explanation: '2 packets damaged by rodents in corner',
      });

    expect(wroRes.status).toBe(201);
    const writeOffId = wroRes.body.writeOff.id;

    // Stock balance MUST NOT CHANGE before approval!
    const balshaktiAfterReport = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);
    expect(balshaktiAfterReport).toBe(balshaktiBefore);

    // Now Supervisor approves the write-off
    const approveRes = await request(app)
      .post(`/api/write-off/${writeOffId}/decide`)
      .set('Authorization', `Bearer ${supToken}`)
      .send({
        decision: 'APPROVE',
        notes: 'Inspected and verified rodent damage. Write-off sanctioned.',
      });

    expect(approveRes.status).toBe(200);

    // Now stock balance is reduced by exactly 2 packets
    const balshaktiAfterApproval = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);
    expect(balshaktiAfterApproval).toBe(balshaktiBefore - 2);
  });

  it('9. Offline Idempotency: Duplicate synchronization requests do not post stock twice', async () => {
    const testOpId = crypto.randomUUID();
    const initialBal = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);

    // First transmission
    const syncRes1 = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${awwToken}`)
      .send({
        operations: [
          {
            operationId: testOpId,
            type: 'THR_DISTRIBUTE',
            payload: {
              awcId: vavdiAwcId,
              distributionCycle: 'OCT-2026',
              distributions: [
                {
                  beneficiaryCategory: 'CHILD_0_TO_3',
                  itemId: balshaktiItemId,
                  quantityDistributed: 1,
                  acknowledgmentType: 'SCREEN_SIGNATURE',
                },
              ],
            },
          },
        ],
      });

    expect(syncRes1.status).toBe(200);
    expect(syncRes1.body.summary.processedCount).toBe(1);

    const balAfterFirst = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);
    expect(balAfterFirst).toBe(initialBal - 1);

    // Duplicate re-transmission with same operationId (e.g. mobile reconnected after packet drop)
    const syncRes2 = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${awwToken}`)
      .send({
        operations: [
          {
            operationId: testOpId,
            type: 'THR_DISTRIBUTE',
            payload: {
              awcId: vavdiAwcId,
              distributions: [
                {
                  beneficiaryCategory: 'CHILD_0_TO_3',
                  itemId: balshaktiItemId,
                  quantityDistributed: 1,
                },
              ],
            },
          },
        ],
      });

    expect(syncRes2.status).toBe(200);
    expect(syncRes2.body.summary.duplicateCount).toBe(1);
    expect(syncRes2.body.summary.processedCount).toBe(0);

    // Stock balance MUST REMAIN EXACTLY initialBal - 1 (NO double debit!)
    const balAfterSecond = await LedgerService.getItemBalance(vavdiAwcId, balshaktiItemId);
    expect(balAfterSecond).toBe(initialBal - 1);
  });

  it('10. Monthly Progress Report (MPR) auto-compilation returns comprehensive accounting', async () => {
    const mprRes = await request(app)
      .get(`/api/reports/mpr?awcId=${vavdiAwcId}&month=2026-10`)
      .set('Authorization', `Bearer ${awwToken}`);

    expect(mprRes.status).toBe(200);
    expect(mprRes.body.mpr).toBeDefined();
    expect(mprRes.body.mpr.itemReports.length).toBeGreaterThan(0);
    expect(mprRes.body.mpr.awc.nameEn).toContain('Vavdi Buzarg');
  });

  it('11. Physical stock count variance opens a discrepancy and supervisor approval creates a ledger adjustment', async () => {
    const bookBefore = await LedgerService.getItemBalance(vavdiAwcId, wheatItemId);
    const countedQty = bookBefore - 5; // 5 kg shortage discovered

    // AWW logs physical count
    const countRes = await request(app)
      .post('/api/physical-count')
      .set('Authorization', `Bearer ${awwToken}`)
      .send({
        awcId: vavdiAwcId,
        itemId: wheatItemId,
        actualPhysicalCount: countedQty,
        reasonCode: 'UNRECORDED_SPILLAGE',
        explanation: 'Sack tear during unloading',
      });

    expect(countRes.status).toBe(201);
    expect(countRes.body.discrepancy).toBeDefined();
    const discrepancyId = countRes.body.discrepancy.id;

    // Book balance must NOT change yet!
    const bookPending = await LedgerService.getItemBalance(vavdiAwcId, wheatItemId);
    expect(bookPending).toBe(bookBefore);

    // Supervisor reviews and approves adjustment
    const actionRes = await request(app)
      .post(`/api/discrepancies/${discrepancyId}/action`)
      .set('Authorization', `Bearer ${supToken}`)
      .send({
        action: 'APPROVE_ADJUSTMENT',
        notes: 'Verified sack damage. Approved 5 kg variance adjustment.',
      });

    expect(actionRes.status).toBe(200);
    expect(actionRes.body.ledgerEvent).toBeDefined();

    // Now book balance has been officially adjusted by -5
    const bookAfter = await LedgerService.getItemBalance(vavdiAwcId, wheatItemId);
    expect(bookAfter).toBe(bookBefore - 5);
  });

  it('12. Audit log accurately records actions and is queryable', async () => {
    const auditRes = await request(app)
      .get('/api/audit?limit=10')
      .set('Authorization', `Bearer ${supToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.logs.length).toBeGreaterThan(0);
    expect(auditRes.body.logs[0].actorRole).toBeDefined();
  });
});
