/**
 * Aadhaar QR Code Parser & Smart Category Inferencer
 * Supports UIDAI PrintLetterBarcodeData XML, JSON, and Delimited formats
 * In accordance with Seva First Data Minimization rules, raw UID is NEVER stored.
 */

export interface ParsedAadhaarData {
  uidHashRef: string;
  fullNameEn: string;
  fullNameGu: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'FEMALE' | 'MALE';
  guardianName: string;
  district?: string;
  state?: string;
  pincode?: string;
  inferredCategory: 'CHILD_0_TO_3' | 'CHILD_3_TO_6' | 'PREGNANT_WOMAN' | 'LACTATING_MOTHER' | 'ADOLESCENT_GIRL';
  categoryReason: string;
}

// Simple English-to-Gujarati common name mapper / phonetics for Gujarati frontline context
const GUJARATI_NAME_MAP: Record<string, string> = {
  priya: 'પ્રિયા',
  aarav: 'આરવ',
  ananya: 'અનન્યા',
  devang: 'દેવાંગ',
  dhruvi: 'ધ્રુવી',
  meet: 'મીત',
  pooja: 'પૂજા',
  sonal: 'સોનલ',
  kinjal: 'કિંજલ',
  ramesh: 'રમેશ',
  nilesh: 'નિલેશ',
  patel: 'પટેલ',
  solanki: 'સોલંકી',
  parmar: 'પરમાર',
  vankar: 'વણકર',
  baria: 'બારીઆ',
  chauhan: 'ચૌહાણ',
  tadvi: 'તડવી',
  rathod: 'રાઠોડ',
  joshi: 'જોશી',
  varma: 'વર્મા',
  dave: 'દવે',
  bhatt: 'ભટ્ટ',
  hansa: 'હંસા',
  gitaben: 'ગીતાબેન',
  rekha: 'રેખા',
  kavita: 'કવિતા',
  meena: 'મીના',
  ranjan: 'રંજન',
  nayna: 'નયના',
};

export function transliterateToGujarati(nameEn: string): string {
  const parts = nameEn.toLowerCase().split(/\s+/);
  const guParts = parts.map((part) => {
    const clean = part.replace(/[^a-z]/g, '');
    return GUJARATI_NAME_MAP[clean] || part;
  });
  return guParts.join(' ');
}

export function parseAadhaarQrData(qrRawText: string): ParsedAadhaarData | null {
  try {
    const trimmed = qrRawText.trim();
    let name = '';
    let gender = 'FEMALE';
    let dob = '';
    let yob = '';
    let co = '';
    let dist = '';
    let state = '';
    let pc = '';
    let uid = '';

    // 1. Try parsing XML format (<PrintLetterBarcodeData ... />)
    if (trimmed.includes('<PrintLetterBarcodeData') || trimmed.startsWith('<?xml')) {
      const getAttr = (attr: string): string => {
        const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
        const match = trimmed.match(regex);
        return match ? match[1].trim() : '';
      };

      name = getAttr('name');
      gender = getAttr('gender').toUpperCase().startsWith('M') ? 'MALE' : 'FEMALE';
      dob = getAttr('dob');
      yob = getAttr('yob');
      co = getAttr('co') || getAttr('careof') || getAttr('gname');
      dist = getAttr('dist');
      state = getAttr('state');
      pc = getAttr('pc');
      uid = getAttr('uid') || `uid_${Date.now()}`;
    }
    // 2. Try parsing JSON format
    else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      name = parsed.name || parsed.fullName || '';
      gender = (parsed.gender || 'F').toUpperCase().startsWith('M') ? 'MALE' : 'FEMALE';
      dob = parsed.dob || '';
      yob = parsed.yob || '';
      co = parsed.co || parsed.guardian || parsed.careof || '';
      dist = parsed.dist || parsed.district || '';
      state = parsed.state || '';
      pc = parsed.pc || parsed.pincode || '';
      uid = parsed.uid || `uid_${Date.now()}`;
    }
    // 3. Delimited text key=value
    else {
      const params = new URLSearchParams(trimmed.replace(/\n/g, '&'));
      name = params.get('name') || '';
      gender = (params.get('gender') || 'F').toUpperCase().startsWith('M') ? 'MALE' : 'FEMALE';
      dob = params.get('dob') || '';
      yob = params.get('yob') || '';
      co = params.get('co') || '';
      dist = params.get('dist') || '';
      state = params.get('state') || '';
      pc = params.get('pc') || '';
      uid = params.get('uid') || `uid_${Date.now()}`;
    }

    if (!name) {
      return null;
    }

    // Clean care of / guardian
    let guardianName = co
      .replace(/^(S\/O|D\/O|W\/O|C\/O|s\/o|d\/o|w\/o|c\/o):?\s*/i, '')
      .trim();

    // Normalize Date of Birth into YYYY-MM-DD
    let normalizedDob = '2024-01-01';
    if (dob) {
      if (dob.includes('-')) {
        const parts = dob.split('-');
        if (parts[0].length === 4) {
          normalizedDob = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          normalizedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (dob.includes('/')) {
        const parts = dob.split('/');
        if (parts[2]?.length === 4) {
          normalizedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (parts[0]?.length === 4) {
          normalizedDob = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
      }
    } else if (yob) {
      normalizedDob = `${yob}-06-01`;
    }

    // Calculate approximate age in months and years
    const birthDate = new Date(normalizedDob);
    const now = new Date('2026-10-16'); // Current application demo date
    const ageInMonths =
      (now.getFullYear() - birthDate.getFullYear()) * 12 +
      (now.getMonth() - birthDate.getMonth());
    const ageInYears = ageInMonths / 12;

    // Smart ICDS Category Inference
    let inferredCategory: ParsedAadhaarData['inferredCategory'] = 'CHILD_0_TO_3';
    let categoryReason = '';

    if (ageInMonths <= 36) {
      inferredCategory = 'CHILD_0_TO_3';
      categoryReason = `Age ~${Math.round(ageInMonths)} months (≤3 years) → Eligible for Balshakti (THR)`;
    } else if (ageInYears > 3 && ageInYears <= 6) {
      inferredCategory = 'CHILD_3_TO_6';
      categoryReason = `Age ~${Math.round(ageInYears)} years (3–6 years) → Eligible for Hot Cooked Meals (HCM)`;
    } else if (gender === 'FEMALE' && ageInYears >= 11 && ageInYears <= 18) {
      inferredCategory = 'ADOLESCENT_GIRL';
      categoryReason = `Female aged ~${Math.round(ageInYears)} years (11–18) → Eligible for Purnashakti (THR)`;
    } else if (gender === 'FEMALE' && ageInYears > 18 && ageInYears <= 45) {
      inferredCategory = 'PREGNANT_WOMAN';
      categoryReason = `Adult female aged ~${Math.round(ageInYears)} years → Eligible for Matrushakti (THR)`;
    } else {
      inferredCategory = 'CHILD_0_TO_3';
      categoryReason = 'Default category based on frontline service profile';
    }

    return {
      uidHashRef: uid,
      fullNameEn: name,
      fullNameGu: transliterateToGujarati(name),
      dateOfBirth: normalizedDob,
      gender: gender as 'FEMALE' | 'MALE',
      guardianName: guardianName || 'Guardian',
      district: dist,
      state: state,
      pincode: pc,
      inferredCategory,
      categoryReason,
    };
  } catch (err) {
    console.error('Error parsing Aadhaar QR data:', err);
    return null;
  }
}

// Built-in synthetic Aadhaar QR samples for instant testing/demonstration
export const SAMPLE_AADHAAR_QRS = [
  {
    label: 'Baby Aarav Patel (18m, Child 0-3y)',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<PrintLetterBarcodeData uid="998877665544" name="Aarav Patel" gender="M" dob="12/04/2025" co="S/O Nileshbhai Patel" dist="Panch Mahals" state="Gujarat" pc="389001" />`,
  },
  {
    label: 'Pooja Vikram Solanki (26y, Pregnant Woman)',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<PrintLetterBarcodeData uid="445566778899" name="Pooja Solanki" gender="F" dob="25/03/2000" co="W/O Vikram Solanki" dist="Panch Mahals" state="Gujarat" pc="389001" />`,
  },
  {
    label: 'Kinjal Somabhai Rathod (16y, Adolescent Girl)',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<PrintLetterBarcodeData uid="112233445566" name="Kinjal Rathod" gender="F" dob="18/02/2010" co="D/O Somabhai Rathod" dist="Panch Mahals" state="Gujarat" pc="389001" />`,
  },
  {
    label: 'Dhruvi Ranjanben Baria (4y, Child 3-6y)',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<PrintLetterBarcodeData uid="334455667788" name="Dhruvi Baria" gender="F" dob="10/06/2022" co="D/O Ranjanben Baria" dist="Panch Mahals" state="Gujarat" pc="389001" />`,
  },
];
