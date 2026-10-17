import { PrismaClient, Role, ItemCategory, UnitOfMeasure, BeneficiaryCategory, DispatchStatus, ReceiptStatus, StockEventType, DiscrepancyType, DiscrepancyStatus, SeverityLevel, WriteOffStatus, PhysicalCountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting KHORAK deterministic database seeding...');

  // Clean existing records in reverse dependency order
  await prisma.syncLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.writeOffRequest.deleteMany();
  await prisma.discrepancy.deleteMany();
  await prisma.physicalCount.deleteMany();
  await prisma.hCMIngredientConsumption.deleteMany();
  await prisma.hCMDailyService.deleteMany();
  await prisma.tHRDistribution.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.stockLedgerEvent.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.dispatchItem.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();
  await prisma.aWC.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.block.deleteMany();
  await prisma.district.deleteMany();
  await prisma.supplier.deleteMany();

  // 1. District: Panchmahal (Gujarat)
  const district = await prisma.district.create({
    data: {
      code: 'GJ-19',
      nameEn: 'Panchmahal',
      nameGu: 'પંચમહાલ',
      state: 'Gujarat',
    },
  });

  // 2. Blocks
  const blockGodhra = await prisma.block.create({
    data: {
      code: 'GODHRA-01',
      nameEn: 'Godhra',
      nameGu: 'ગોધરા',
      districtId: district.id,
    },
  });

  const blockHalol = await prisma.block.create({
    data: {
      code: 'HALOL-02',
      nameEn: 'Halol',
      nameGu: 'હાલોલ',
      districtId: district.id,
    },
  });

  // 3. Sectors
  const sectorGodhraRural = await prisma.sector.create({
    data: {
      code: 'SEC-GOD-RUR-A',
      nameEn: 'Godhra Rural Sector A',
      nameGu: 'ગોધરા ગ્રામ્ય સેક્ટર A',
      blockId: blockGodhra.id,
    },
  });

  const sectorGodhraUrban = await prisma.sector.create({
    data: {
      code: 'SEC-GOD-URB-B',
      nameEn: 'Godhra Urban Sector B',
      nameGu: 'ગોધરા શહેરી સેક્ટર B',
      blockId: blockGodhra.id,
    },
  });

  const sectorHalolRural = await prisma.sector.create({
    data: {
      code: 'SEC-HAL-RUR-C',
      nameEn: 'Halol Rural Sector C',
      nameGu: 'હાલોલ ગ્રામ્ય સેક્ટર C',
      blockId: blockHalol.id,
    },
  });

  // 4. AWCs (At least 5 AWCs with varied operational states)
  const awcVavdi = await prisma.aWC.create({
    data: {
      code: '24190101',
      nameEn: 'Vavdi Buzarg Anganwadi',
      nameGu: 'વાવડી બુઝર્ગ આંગણવાડી કેન્દ્ર',
      sectorId: sectorGodhraRural.id,
      address: 'Near Primary School, Vavdi Buzarg, Godhra',
      contactPhone: '9825101011',
      enrolledBeneficiariesCount: 42,
    },
  });

  const awcChhabanpur = await prisma.aWC.create({
    data: {
      code: '24190102',
      nameEn: 'Chhabanpur Anganwadi',
      nameGu: 'છાબનપુર આંગણવાડી કેન્દ્ર',
      sectorId: sectorGodhraRural.id,
      address: 'Main Bazaar Road, Chhabanpur',
      contactPhone: '9825101012',
      enrolledBeneficiariesCount: 38,
    },
  });

  const awcNasirpur = await prisma.aWC.create({
    data: {
      code: '24190103',
      nameEn: 'Nasirpur Anganwadi',
      nameGu: 'નાસિરપુર આંગણવાડી કેન્દ્ર',
      sectorId: sectorGodhraRural.id,
      address: 'Gram Panchayat Compound, Nasirpur',
      contactPhone: '9825101013',
      enrolledBeneficiariesCount: 45,
    },
  });

  const awcTuwa = await prisma.aWC.create({
    data: {
      code: '24190104',
      nameEn: 'Tuwa Anganwadi',
      nameGu: 'ટુવા આંગણવાડી કેન્દ્ર',
      sectorId: sectorGodhraRural.id,
      address: 'Hot Spring Road, Tuwa',
      contactPhone: '9825101014',
      enrolledBeneficiariesCount: 36,
    },
  });

  const awcVejalpur = await prisma.aWC.create({
    data: {
      code: '24190201',
      nameEn: 'Vejalpur Anganwadi',
      nameGu: 'વેજલપુર આંગણવાડી કેન્દ્ર',
      sectorId: sectorHalolRural.id,
      address: 'Bus Stand Faliyu, Vejalpur, Halol',
      contactPhone: '9825102011',
      enrolledBeneficiariesCount: 50,
    },
  });

  // 5. Suppliers
  const supplierAmul = await prisma.supplier.create({
    data: {
      code: 'SUP-GCMMFL-01',
      nameEn: 'GCMMFL / Amul Dairy Supply Div',
      nameGu: 'જીસીએમએમએફએલ / અમૂલ ફેડરેશન',
      supplierType: 'GCMMFL',
      contactPerson: 'Kishorebhai Bhatt',
      phone: '9825001122',
      address: 'Amul Dairy Road, Anand / Godhra Plant',
    },
  });

  const supplierGscscl = await prisma.supplier.create({
    data: {
      code: 'SUP-GSCSCL-02',
      nameEn: 'GSCSCL Panchmahal Godown',
      nameGu: 'ગુજરાત રાજ્ય નાગરિક પુરવઠા નિગમ (ગોધરા)',
      supplierType: 'GSCSCL',
      contactPerson: 'Dineshbhai Baria',
      phone: '9825003344',
      address: 'APMC Market Yard, Godhra',
    },
  });

  // 6. Users with bcrypt password hashes
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('khorak123', salt);

  // AWW Hansaben
  const userAww = await prisma.user.create({
    data: {
      username: 'aww_hansa',
      passwordHash: commonPasswordHash,
      fullNameEn: 'Hansaben Patel',
      fullNameGu: 'હંસાબેન પટેલ',
      role: Role.AWW,
      phone: '9879001001',
      languagePreference: 'gu',
      awcId: awcVavdi.id,
    },
  });

  // AWH Gitaben
  const userAwh = await prisma.user.create({
    data: {
      username: 'awh_gitaben',
      passwordHash: commonPasswordHash,
      fullNameEn: 'Gitaben Parmar',
      fullNameGu: 'ગીતાબેન પરમાર',
      role: Role.AWH,
      phone: '9879001002',
      languagePreference: 'gu',
      awcId: awcVavdi.id,
    },
  });

  // Supervisor Rekhaben
  const userSupervisor = await prisma.user.create({
    data: {
      username: 'sup_rekha',
      passwordHash: commonPasswordHash,
      fullNameEn: 'Rekhaben Varma',
      fullNameGu: 'રેખાબેન વર્મા',
      role: Role.SUPERVISOR,
      phone: '9879002001',
      languagePreference: 'gu',
      sectorId: sectorGodhraRural.id,
    },
  });

  // CDPO Maheshbhai
  const userCdpo = await prisma.user.create({
    data: {
      username: 'cdpo_mahesh',
      passwordHash: commonPasswordHash,
      fullNameEn: 'Maheshbhai Joshi',
      fullNameGu: 'મહેશભાઈ જોશી',
      role: Role.CDPO,
      phone: '9879003001',
      languagePreference: 'gu',
      blockId: blockGodhra.id,
    },
  });

  // DPO Dr. Priyaben
  const userDpo = await prisma.user.create({
    data: {
      username: 'dpo_priya',
      passwordHash: commonPasswordHash,
      fullNameEn: 'Dr. Priyaben Dave',
      fullNameGu: 'ડો. પ્રિયાબેન દવે',
      role: Role.DPO,
      phone: '9879004001',
      languagePreference: 'en',
    },
  });

  // Supplier User
  const userSupplier = await prisma.user.create({
    data: {
      username: 'supplier_amul',
      passwordHash: commonPasswordHash,
      fullNameEn: 'Kishorebhai Bhatt (GCMMFL Logistics)',
      fullNameGu: 'કિશોરભાઈ ભટ્ટ (અમૂલ લોજિસ્ટિક્સ)',
      role: Role.SUPPLIER,
      phone: '9879005001',
      languagePreference: 'en',
      supplierId: supplierAmul.id,
    },
  });

  // 7. Master Nutrition Items
  const itemBalshakti = await prisma.item.create({
    data: {
      code: 'THR-BAL-01',
      nameEn: 'Balshakti (THR Premix)',
      nameGu: 'બાલશક્તિ (ટી.એચ.આર. પેકેટ)',
      category: ItemCategory.THR_PACKET,
      unit: UnitOfMeasure.PACKET,
      minStockThresholdDays: 7,
      shelfLifeDays: 90,
      caloriesPerUnit: 500,
      proteinGramsPerUnit: 12.5,
      description: 'Extruded fortified premix for children 6 months to 3 years (500g packet).',
    },
  });

  const itemMatrushakti = await prisma.item.create({
    data: {
      code: 'THR-MAT-02',
      nameEn: 'Matrushakti (THR Premix)',
      nameGu: 'માતૃશક્તિ (ટી.એચ.આર. પેકેટ)',
      category: ItemCategory.THR_PACKET,
      unit: UnitOfMeasure.PACKET,
      minStockThresholdDays: 7,
      shelfLifeDays: 90,
      caloriesPerUnit: 600,
      proteinGramsPerUnit: 18.0,
      description: 'Fortified nutrition premix for pregnant women and lactating mothers (1kg packet).',
    },
  });

  const itemPurnashakti = await prisma.item.create({
    data: {
      code: 'THR-PUR-03',
      nameEn: 'Purnashakti (THR Premix)',
      nameGu: 'પૂર્ણાશક્તિ (કિશોરીઓ માટે)',
      category: ItemCategory.THR_PACKET,
      unit: UnitOfMeasure.PACKET,
      minStockThresholdDays: 7,
      shelfLifeDays: 90,
      caloriesPerUnit: 600,
      proteinGramsPerUnit: 18.0,
      description: 'Fortified premix for out-of-school adolescent girls 14-18 years (1kg packet).',
    },
  });

  const itemWheat = await prisma.item.create({
    data: {
      code: 'HCM-WHT-01',
      nameEn: 'Fortified Wheat Grain',
      nameGu: 'ફોર્ટિફાઇડ ઘઉં (ગરમ ભોજન)',
      category: ItemCategory.HCM_RAW_GRAIN,
      unit: UnitOfMeasure.KG,
      minStockThresholdDays: 10,
      shelfLifeDays: 180,
      description: 'Whole wheat for preparing hot cooked meals (Kichdi, Roti, Sukhdi).',
    },
  });

  const itemRice = await prisma.item.create({
    data: {
      code: 'HCM-RIC-02',
      nameEn: 'Fortified Rice',
      nameGu: 'ફોર્ટિફાઇડ ચોખા (ગરમ ભોજન)',
      category: ItemCategory.HCM_RAW_GRAIN,
      unit: UnitOfMeasure.KG,
      minStockThresholdDays: 10,
      shelfLifeDays: 180,
      description: 'Fortified parboiled rice for daily midday meal at AWC.',
    },
  });

  const itemDal = await prisma.item.create({
    data: {
      code: 'HCM-DAL-03',
      nameEn: 'Tuver / Moong Dal',
      nameGu: 'તુવેર / મગ દાળ (ગરમ ભોજન)',
      category: ItemCategory.HCM_PULSE,
      unit: UnitOfMeasure.KG,
      minStockThresholdDays: 10,
      shelfLifeDays: 180,
      description: 'Yellow split pulses rich in vegetable protein for child meals.',
    },
  });

  const itemOil = await prisma.item.create({
    data: {
      code: 'HCM-OIL-04',
      nameEn: 'Fortified Cooking Oil',
      nameGu: 'ફોર્ટિફાઇડ ખાદ્ય તેલ',
      category: ItemCategory.HCM_OIL,
      unit: UnitOfMeasure.LITRE,
      minStockThresholdDays: 10,
      shelfLifeDays: 240,
      description: 'Vitamin A & D fortified edible vegetable oil.',
    },
  });

  // 8. Batches
  const batchBalshaktiOct = await prisma.batch.create({
    data: {
      itemId: itemBalshakti.id,
      batchNumber: 'BAL-2026-OCT-B12',
      manufacturingDate: new Date('2026-10-01'),
      expiryDate: new Date('2027-01-01'),
      supplierId: supplierAmul.id,
    },
  });

  const batchMatrushaktiOct = await prisma.batch.create({
    data: {
      itemId: itemMatrushakti.id,
      batchNumber: 'MAT-2026-OCT-M05',
      manufacturingDate: new Date('2026-10-01'),
      expiryDate: new Date('2027-01-01'),
      supplierId: supplierAmul.id,
    },
  });

  // 9. Beneficiaries for Vavdi Buzarg AWC
  const beneficiariesData = [
    { nameEn: 'Aarav Patel', nameGu: 'આરવ પટેલ', cat: BeneficiaryCategory.CHILD_0_TO_3, guardian: 'Rekhaben Patel', dob: new Date('2025-04-12'), gender: 'MALE', aadhaar: 'aadhaar_sha256_mock_001' },
    { nameEn: 'Ananya Parmar', nameGu: 'અનન્યા પરમાર', cat: BeneficiaryCategory.CHILD_0_TO_3, guardian: 'Kavitaben Parmar', dob: new Date('2024-11-20'), gender: 'FEMALE', aadhaar: 'aadhaar_sha256_mock_002' },
    { nameEn: 'Devang Vankar', nameGu: 'દેવાંગ વણકર', cat: BeneficiaryCategory.CHILD_0_TO_3, guardian: 'Meenaben Vankar', dob: new Date('2025-01-15'), gender: 'MALE', aadhaar: 'aadhaar_sha256_mock_003' },
    { nameEn: 'Dhruvi Baria', nameGu: 'ધ્રુવી બારીઆ', cat: BeneficiaryCategory.CHILD_3_TO_6, guardian: 'Ranjanben Baria', dob: new Date('2022-06-10'), gender: 'FEMALE', aadhaar: 'aadhaar_sha256_mock_004' },
    { nameEn: 'Meet Chauhan', nameGu: 'મીત ચૌહાણ', cat: BeneficiaryCategory.CHILD_3_TO_6, guardian: 'Naynaben Chauhan', dob: new Date('2021-09-05'), gender: 'MALE', aadhaar: 'aadhaar_sha256_mock_005' },
    { nameEn: 'Pooja Solanki', nameGu: 'પૂજા સોલંકી', cat: BeneficiaryCategory.PREGNANT_WOMAN, guardian: 'Vikram Solanki', dob: new Date('2000-03-25'), gender: 'FEMALE', aadhaar: 'aadhaar_sha256_mock_006' },
    { nameEn: 'Sonal Tadvi', nameGu: 'સોનલ તડવી', cat: BeneficiaryCategory.LACTATING_MOTHER, guardian: 'Rameshbhai Tadvi', dob: new Date('1998-08-14'), gender: 'FEMALE', aadhaar: 'aadhaar_sha256_mock_007' },
    { nameEn: 'Kinjal Rathod', nameGu: 'કિંજલ રાઠોડ', cat: BeneficiaryCategory.ADOLESCENT_GIRL, guardian: 'Somabhai Rathod', dob: new Date('2010-02-18'), gender: 'FEMALE', aadhaar: 'aadhaar_sha256_mock_008' },
  ];

  const seededBeneficiaries = [];
  for (const b of beneficiariesData) {
    const created = await prisma.beneficiary.create({
      data: {
        awcId: awcVavdi.id,
        hashedAadhaar: b.aadhaar,
        fullNameEn: b.nameEn,
        fullNameGu: b.nameGu,
        category: b.cat,
        guardianName: b.guardian,
        dateOfBirth: b.dob,
        gender: b.gender,
      },
    });
    seededBeneficiaries.push(created);
  }

  // 10. Initial Stock Balances via StockLedgerEvents (Append-Only)
  // Vavdi Buzarg initial stock
  await prisma.stockLedgerEvent.create({
    data: {
      awcId: awcVavdi.id,
      itemId: itemBalshakti.id,
      batchNumber: 'BAL-2026-SEP-B09',
      eventType: StockEventType.OPENING_BALANCE,
      quantityChange: 60,
      balanceAfter: 60,
      unit: UnitOfMeasure.PACKET,
      referenceType: 'OPENING_REGISTER',
      actorUserId: userAww.id,
      serverCreatedAt: new Date('2026-10-01T09:00:00Z'),
      reasonNote: 'Beginning of month register physical verification',
    },
  });

  await prisma.stockLedgerEvent.create({
    data: {
      awcId: awcVavdi.id,
      itemId: itemMatrushakti.id,
      batchNumber: 'MAT-2026-SEP-M02',
      eventType: StockEventType.OPENING_BALANCE,
      quantityChange: 35,
      balanceAfter: 35,
      unit: UnitOfMeasure.PACKET,
      referenceType: 'OPENING_REGISTER',
      actorUserId: userAww.id,
      serverCreatedAt: new Date('2026-10-01T09:00:00Z'),
      reasonNote: 'Beginning of month register verification',
    },
  });

  await prisma.stockLedgerEvent.create({
    data: {
      awcId: awcVavdi.id,
      itemId: itemWheat.id,
      eventType: StockEventType.OPENING_BALANCE,
      quantityChange: 50.0,
      balanceAfter: 50.0,
      unit: UnitOfMeasure.KG,
      referenceType: 'OPENING_REGISTER',
      actorUserId: userAww.id,
      serverCreatedAt: new Date('2026-10-01T09:00:00Z'),
      reasonNote: 'Grain inventory opening balance',
    },
  });

  await prisma.stockLedgerEvent.create({
    data: {
      awcId: awcVavdi.id,
      itemId: itemRice.id,
      eventType: StockEventType.OPENING_BALANCE,
      quantityChange: 45.0,
      balanceAfter: 45.0,
      unit: UnitOfMeasure.KG,
      referenceType: 'OPENING_REGISTER',
      actorUserId: userAww.id,
      serverCreatedAt: new Date('2026-10-01T09:00:00Z'),
      reasonNote: 'Rice inventory opening balance',
    },
  });

  await prisma.stockLedgerEvent.create({
    data: {
      awcId: awcVavdi.id,
      itemId: itemDal.id,
      eventType: StockEventType.OPENING_BALANCE,
      quantityChange: 15.0,
      balanceAfter: 15.0,
      unit: UnitOfMeasure.KG,
      referenceType: 'OPENING_REGISTER',
      actorUserId: userAww.id,
      serverCreatedAt: new Date('2026-10-01T09:00:00Z'),
      reasonNote: 'Pulses opening balance',
    },
  });

  await prisma.stockLedgerEvent.create({
    data: {
      awcId: awcVavdi.id,
      itemId: itemOil.id,
      eventType: StockEventType.OPENING_BALANCE,
      quantityChange: 8.0,
      balanceAfter: 8.0,
      unit: UnitOfMeasure.LITRE,
      referenceType: 'OPENING_REGISTER',
      actorUserId: userAww.id,
      serverCreatedAt: new Date('2026-10-01T09:00:00Z'),
      reasonNote: 'Oil opening balance',
    },
  });

  // Chhabanpur AWC (Low Stock item: only 8 packets Balshakti remaining)
  await prisma.stockLedgerEvent.create({
    data: {
      awcId: awcChhabanpur.id,
      itemId: itemBalshakti.id,
      eventType: StockEventType.OPENING_BALANCE,
      quantityChange: 8,
      balanceAfter: 8,
      unit: UnitOfMeasure.PACKET,
      referenceType: 'OPENING_REGISTER',
      actorUserId: userSupervisor.id,
      serverCreatedAt: new Date('2026-10-01T09:00:00Z'),
      reasonNote: 'Critical low stock state (3-day supply left)',
    },
  });

  // 11. Discrepancy Scenario: Nasirpur AWC has an unresolved SHORT DELIVERY
  // Dispatch of 100 packets, but AWW only received 80 packets (20 packets missing)
  const dispatchNasirpur = await prisma.dispatch.create({
    data: {
      dispatchNumber: 'DSP-2026-002',
      challanNumber: 'CH-GCMMFL-8812',
      supplierId: supplierAmul.id,
      destinationAwcId: awcNasirpur.id,
      dispatchDate: new Date('2026-10-05T08:30:00Z'),
      status: DispatchStatus.PARTIALLY_RECEIVED,
      vehicleNumber: 'GJ-17-X-4421',
      driverName: 'Ramesh Rabari',
      driverPhone: '9825112233',
      notes: 'Dispatched 100 packets Balshakti.',
    },
  });

  await prisma.dispatchItem.create({
    data: {
      dispatchId: dispatchNasirpur.id,
      itemId: itemBalshakti.id,
      batchNumber: batchBalshaktiOct.batchNumber,
      quantityDispatched: 100,
      unit: UnitOfMeasure.PACKET,
    },
  });

  // AWW Receipt: Accepted 80 packets only! (20 missing)
  const receiptNasirpur = await prisma.receipt.create({
    data: {
      receiptNumber: 'RCP-2026-002',
      dispatchId: dispatchNasirpur.id,
      awcId: awcNasirpur.id,
      challanNumber: 'CH-GCMMFL-8812',
      receivedDate: new Date('2026-10-05T11:45:00Z'),
      receivedByUserId: userSupervisor.id, // recorded by worker
      supervisorOtpVerified: false,
      status: ReceiptStatus.HAS_DISCREPANCIES,
      notes: 'Vehicle driver had only 4 cartons instead of 5. Shortage of 20 packets.',
    },
  });

  await prisma.receiptItem.create({
    data: {
      receiptId: receiptNasirpur.id,
      itemId: itemBalshakti.id,
      batchNumber: batchBalshaktiOct.batchNumber,
      quantityExpected: 100,
      quantityAccepted: 80, // ONLY 80 enters stock
      quantityShort: 20,
      quantityDamaged: 0,
      quantityRejected: 0,
      unit: UnitOfMeasure.PACKET,
      conditionStatus: 'SHORTAGE',
      notes: '1 carton (20 pkts) missing from transport.',
    },
  });

  // Stock Ledger event: ONLY 80 packets added
  await prisma.stockLedgerEvent.create({
    data: {
      awcId: awcNasirpur.id,
      itemId: itemBalshakti.id,
      batchNumber: batchBalshaktiOct.batchNumber,
      eventType: StockEventType.RECEIPT_INTAKE,
      quantityChange: 80,
      balanceAfter: 80,
      unit: UnitOfMeasure.PACKET,
      referenceType: 'RECEIPT',
      referenceId: receiptNasirpur.id,
      actorUserId: userSupervisor.id,
      serverCreatedAt: new Date('2026-10-05T11:45:00Z'),
      reasonNote: 'Partial delivery received: 80 accepted (20 short)',
    },
  });

  // Discrepancy Case for Nasirpur
  await prisma.discrepancy.create({
    data: {
      caseNumber: 'DSC-2026-001',
      awcId: awcNasirpur.id,
      itemId: itemBalshakti.id,
      discrepancyType: DiscrepancyType.SHORT_DELIVERY,
      relatedEntityType: 'RECEIPT',
      relatedEntityId: receiptNasirpur.id,
      expectedQuantity: 100,
      actualQuantity: 80,
      varianceQuantity: -20,
      unit: UnitOfMeasure.PACKET,
      severity: SeverityLevel.HIGH,
      status: DiscrepancyStatus.OPEN,
      reportedByUserId: userAww.id,
      resolutionNotes: 'Awaiting supplier transport investigation report regarding missing carton.',
    },
  });

  // 12. Write-Off Scenario: Vavdi Buzarg has a pending Spoilage / Rodent Damage report
  await prisma.writeOffRequest.create({
    data: {
      caseNumber: 'WRO-2026-001',
      awcId: awcVavdi.id,
      itemId: itemBalshakti.id,
      batchNumber: 'BAL-2026-SEP-B09',
      quantity: 4,
      unit: UnitOfMeasure.PACKET,
      reasonCode: 'RODENT_DAMAGE',
      explanation: 'Four packets found torn by rats in the rear storeroom corner. Food contaminated and unsafe for infants.',
      voiceNoteTranscript: 'પાછળના સ્ટોર રૂમમાં ઉંદર દ્વારા ચાર પેકેટ ફાટી ગયેલ મળ્યા. બાળકો માટે અસુરક્ષિત હોવાથી અલગ મૂકેલ છે.',
      photoUrl: '/evidence/damaged_packets_mock.jpg',
      status: WriteOffStatus.PENDING_SUPERVISOR,
      reportedByUserId: userAww.id,
    },
  });

  // 13. Discrepancy Scenario 2: Tuwa AWC Physical Count Variance
  await prisma.physicalCount.create({
    data: {
      awcId: awcTuwa.id,
      countDate: new Date('2026-10-10T14:00:00Z'),
      itemId: itemWheat.id,
      computedBookBalance: 45.0,
      actualPhysicalCount: 38.0,
      variance: -7.0, // 7 kg missing
      status: PhysicalCountStatus.PENDING_REVIEW,
      reasonCode: 'UNRECORDED_SPILLAGE',
      explanation: 'Gunny sack seam burst during rains, spillage not recorded promptly.',
      conductedByUserId: userSupervisor.id,
    },
  });

  await prisma.discrepancy.create({
    data: {
      caseNumber: 'DSC-2026-002',
      awcId: awcTuwa.id,
      itemId: itemWheat.id,
      discrepancyType: DiscrepancyType.PHYSICAL_COUNT_VARIANCE,
      relatedEntityType: 'PHYSICAL_COUNT',
      relatedEntityId: 'count_tuwa_wheat_01',
      expectedQuantity: 45.0,
      actualQuantity: 38.0,
      varianceQuantity: -7.0,
      unit: UnitOfMeasure.KG,
      severity: SeverityLevel.MEDIUM,
      status: DiscrepancyStatus.OPEN,
      reportedByUserId: userAww.id,
      resolutionNotes: 'Supervisor site inspection scheduled for sack weighment check.',
    },
  });

  // 14. Ready-to-Receive Dispatch for LIVE DEMO:
  // GCMMFL has dispatched 100 packets Balshakti to Vavdi Buzarg AWC!
  const liveDemoDispatch = await prisma.dispatch.create({
    data: {
      dispatchNumber: 'DSP-2026-003',
      challanNumber: 'CH-GCMMFL-9042',
      supplierId: supplierAmul.id,
      destinationAwcId: awcVavdi.id,
      dispatchDate: new Date(),
      expectedDeliveryDate: new Date(),
      status: DispatchStatus.DISPATCHED,
      vehicleNumber: 'GJ-17-Y-7733',
      driverName: 'Sanjaybhai Solanki',
      driverPhone: '9825445566',
      notes: 'Scheduled monthly quota delivery for Vavdi Buzarg AWC. 100 Packets Balshakti.',
    },
  });

  await prisma.dispatchItem.create({
    data: {
      dispatchId: liveDemoDispatch.id,
      itemId: itemBalshakti.id,
      batchNumber: batchBalshaktiOct.batchNumber,
      quantityDispatched: 100,
      unit: UnitOfMeasure.PACKET,
    },
  });

  // Also an incoming HCM supply for Vavdi Buzarg
  const liveDemoDispatchHcm = await prisma.dispatch.create({
    data: {
      dispatchNumber: 'DSP-2026-004',
      challanNumber: 'CH-GSCSCL-4410',
      supplierId: supplierGscscl.id,
      destinationAwcId: awcVavdi.id,
      dispatchDate: new Date(),
      expectedDeliveryDate: new Date(),
      status: DispatchStatus.DISPATCHED,
      vehicleNumber: 'GJ-17-T-1288',
      driverName: 'Govindbhai Baria',
      driverPhone: '9825667788',
      notes: 'GSCSCL monthly grain quota: Wheat 50kg, Rice 40kg, Dal 20kg.',
    },
  });

  await prisma.dispatchItem.create({
    data: {
      dispatchId: liveDemoDispatchHcm.id,
      itemId: itemWheat.id,
      quantityDispatched: 50,
      unit: UnitOfMeasure.KG,
    },
  });

  await prisma.dispatchItem.create({
    data: {
      dispatchId: liveDemoDispatchHcm.id,
      itemId: itemRice.id,
      quantityDispatched: 40,
      unit: UnitOfMeasure.KG,
    },
  });

  await prisma.dispatchItem.create({
    data: {
      dispatchId: liveDemoDispatchHcm.id,
      itemId: itemDal.id,
      quantityDispatched: 20,
      unit: UnitOfMeasure.KG,
    },
  });

  // 15. Initial Alerts for Dashboards
  await prisma.alert.create({
    data: {
      recipientRole: Role.AWW,
      awcId: awcVavdi.id,
      alertType: 'NEW_DELIVERY_INCOMING',
      severity: SeverityLevel.MEDIUM,
      titleEn: 'Incoming Delivery from GCMMFL',
      titleGu: 'અમૂલ તરફથી નવો સ્ટોક ડિસ્પેચ થયો છે',
      messageEn: 'Challan CH-GCMMFL-9042 with 100 Balshakti packets is en route.',
      messageGu: 'ચલણ CH-GCMMFL-9042: ૧૦૦ બાલશક્તિ પેકેટ લઈને વાહન રવાના થયું છે.',
      linkRoute: '/dispatches',
    },
  });

  await prisma.alert.create({
    data: {
      recipientRole: Role.SUPERVISOR,
      awcId: awcNasirpur.id,
      alertType: 'SHORT_DELIVERY',
      severity: SeverityLevel.HIGH,
      titleEn: 'Short Delivery Flagged at Nasirpur',
      titleGu: 'નાસિરપુરમાં ઓછો જથ્થો આવ્યો છે (૨૦ પેકેટ ઘટ)',
      messageEn: 'Challan CH-GCMMFL-8812 was received short by 20 packets. Discrepancy #DSC-2026-001 opened.',
      messageGu: '૨૦ પેકેટ ઓછા મળ્યા હોવાની વિસંગતતા કેસ #DSC-2026-001 નોંધાયો છે.',
      linkRoute: '/discrepancies',
    },
  });

  await prisma.alert.create({
    data: {
      recipientRole: Role.SUPERVISOR,
      awcId: awcChhabanpur.id,
      alertType: 'LOW_STOCK_RUNOUT',
      severity: SeverityLevel.CRITICAL,
      titleEn: 'Critical Low Stock at Chhabanpur',
      titleGu: 'છાબનપુરમાં ગંભીર સ્ટોક અછત (૩ દિવસ બાકી)',
      messageEn: 'Balshakti packets below minimum 7-day reserve (only 8 packets remaining).',
      messageGu: 'બાલશક્તિના માત્ર ૮ પેકેટ બાકી છે. તાત્કાલિક ઇન્ડેન્ટ જરૂરી છે.',
      linkRoute: '/stock',
    },
  });

  // 16. Audit Log Baseline
  await prisma.auditLog.create({
    data: {
      actorUserId: userAww.id,
      actorRole: Role.AWW,
      awcId: awcVavdi.id,
      entityType: 'STOCK_LEDGER',
      entityId: 'INIT-OCT-2026',
      action: 'CREATE',
      newValueJson: JSON.stringify({ event: 'OPENING_BALANCES_RECORDED', awcCode: '24190101' }),
      reasonCode: 'OCTOBER_CYCLE_INITIATION',
      timestamp: new Date('2026-10-01T09:00:00Z'),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: userSupplier.id,
      actorRole: Role.SUPPLIER,
      entityType: 'DISPATCH',
      entityId: liveDemoDispatch.id,
      action: 'CREATE',
      newValueJson: JSON.stringify({ dispatchNumber: 'DSP-2026-003', packets: 100, awc: '24190101' }),
      reasonCode: 'REGULAR_SUPPLY_CYCLE',
      timestamp: new Date(),
    },
  });

  console.log('✅ KHORAK seeding completed successfully!');
  console.log('--- DEMO ACCOUNTS CREATED ---');
  console.log('1. AWW (Frontline):      aww_hansa      / khorak123 (Vavdi Buzarg AWC)');
  console.log('2. AWH (Helper):         awh_gitaben    / khorak123 (Vavdi Buzarg AWC - Read-only)');
  console.log('3. Supervisor:           sup_rekha      / khorak123 (Godhra Rural Sector A)');
  console.log('4. CDPO (Block):         cdpo_mahesh    / khorak123 (Godhra Block)');
  console.log('5. DPO (District):       dpo_priya      / khorak123 (Panchmahal District)');
  console.log('6. Supplier (GCMMFL):    supplier_amul  / khorak123 (Amul Fed Logistics)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
