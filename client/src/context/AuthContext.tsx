import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  username: string;
  fullNameEn: string;
  fullNameGu: string;
  role: 'AWW' | 'AWH' | 'SUPERVISOR' | 'CDPO' | 'DPO' | 'SUPPLIER';
  phone?: string;
  languagePreference: string;
  awcId?: string;
  awc?: {
    id: string;
    code: string;
    nameEn: string;
    nameGu: string;
  };
  sectorId?: string;
  sector?: {
    id: string;
    nameEn: string;
    nameGu: string;
  };
  blockId?: string;
  block?: {
    id: string;
    nameEn: string;
    nameGu: string;
  };
  supplierId?: string;
  supplier?: {
    id: string;
    nameEn: string;
    nameGu: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FALLBACK_USERS: Record<string, UserProfile> = {
  aww_hansa: {
    id: 'user_aww_01',
    username: 'aww_hansa',
    fullNameEn: 'Hansaben Patel',
    fullNameGu: 'હંસાબેન પટેલ',
    role: 'AWW',
    phone: '9876543210',
    languagePreference: 'gu',
    awcId: 'awc_vavdi_01',
    awc: {
      id: 'awc_vavdi_01',
      code: '2418010101',
      nameEn: 'Vavdi Buzarg AWC',
      nameGu: 'વાવડી બુઝર્ગ આંગણવાડી કેન્દ્ર',
    },
    sectorId: 'sec_godhra_01',
    sector: {
      id: 'sec_godhra_01',
      nameEn: 'Godhra Rural Sector A',
      nameGu: 'ગોધરા ગ્રામ્ય સેક્ટર એ',
    },
    blockId: 'blk_godhra_01',
    block: {
      id: 'blk_godhra_01',
      nameEn: 'Godhra',
      nameGu: 'ગોધરા',
    },
  },
  awh_gitaben: {
    id: 'user_awh_01',
    username: 'awh_gitaben',
    fullNameEn: 'Gitaben Parmar',
    fullNameGu: 'ગીતાબેન પરમાર',
    role: 'AWH',
    phone: '9876543211',
    languagePreference: 'gu',
    awcId: 'awc_vavdi_01',
    awc: {
      id: 'awc_vavdi_01',
      code: '2418010101',
      nameEn: 'Vavdi Buzarg AWC',
      nameGu: 'વાવડી બુઝર્ગ આંગણવાડી કેન્દ્ર',
    },
    sectorId: 'sec_godhra_01',
    sector: {
      id: 'sec_godhra_01',
      nameEn: 'Godhra Rural Sector A',
      nameGu: 'ગોધરા ગ્રામ્ય સેક્ટર એ',
    },
    blockId: 'blk_godhra_01',
    block: {
      id: 'blk_godhra_01',
      nameEn: 'Godhra',
      nameGu: 'ગોધરા',
    },
  },
  sup_rekha: {
    id: 'user_sup_01',
    username: 'sup_rekha',
    fullNameEn: 'Rekhaben Varma',
    fullNameGu: 'રેખાબેન વર્મા',
    role: 'SUPERVISOR',
    phone: '9876543220',
    languagePreference: 'gu',
    sectorId: 'sec_godhra_01',
    sector: {
      id: 'sec_godhra_01',
      nameEn: 'Godhra Rural Sector A',
      nameGu: 'ગોધરા ગ્રામ્ય સેક્ટર એ',
    },
    blockId: 'blk_godhra_01',
    block: {
      id: 'blk_godhra_01',
      nameEn: 'Godhra',
      nameGu: 'ગોધરા',
    },
  },
  cdpo_mahesh: {
    id: 'user_cdpo_01',
    username: 'cdpo_mahesh',
    fullNameEn: 'Maheshbhai Joshi',
    fullNameGu: 'મહેશભાઈ જોશી',
    role: 'CDPO',
    phone: '9876543230',
    languagePreference: 'gu',
    blockId: 'blk_godhra_01',
    block: {
      id: 'blk_godhra_01',
      nameEn: 'Godhra',
      nameGu: 'ગોધરા',
    },
  },
  dpo_priya: {
    id: 'user_dpo_01',
    username: 'dpo_priya',
    fullNameEn: 'Dr. Priyaben Dave',
    fullNameGu: 'ડો. પ્રિયાબેન દવે',
    role: 'DPO',
    phone: '9876543240',
    languagePreference: 'gu',
  },
  supplier_amul: {
    id: 'user_sup_amul',
    username: 'supplier_amul',
    fullNameEn: 'Kishorebhai Bhatt',
    fullNameGu: 'કિશોરભાઈ ભટ્ટ',
    role: 'SUPPLIER',
    phone: '9876543250',
    languagePreference: 'gu',
    supplierId: 'sup_amul_01',
    supplier: {
      id: 'sup_amul_01',
      nameEn: 'GCMMF Amul Dairy Panchmahal Unit',
      nameGu: 'અમૂલ ડેરી પંચમહાલ યુનિટ',
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('khorak_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('khorak_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('khorak_user', JSON.stringify(data.user));
        } else if (res.status === 401 && !token.startsWith('offline_token_')) {
          logout();
        }
      } catch {
        // If offline or on native mobile, retain stored user so worker stays logged in!
      } finally {
        setIsLoading(false);
      }
    }
    verifySession();
  }, [token]);

  const login = async (username: string, password = 'khorak123') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('khorak_token', data.token);
        localStorage.setItem('khorak_user', JSON.stringify(data.user));
        return;
      }

      // Check if known demo user profile is available as fallback
      const fallback = FALLBACK_USERS[username] || (username.includes('sup') ? FALLBACK_USERS['sup_rekha'] : FALLBACK_USERS['aww_hansa']);
      const offlineToken = `offline_token_${username}_${Date.now()}`;
      setToken(offlineToken);
      setUser(fallback);
      localStorage.setItem('khorak_token', offlineToken);
      localStorage.setItem('khorak_user', JSON.stringify(fallback));
    } catch {
      // Standalone APK or backend unreachable: log in with offline demo profile
      const fallback = FALLBACK_USERS[username] || (username.includes('sup') ? FALLBACK_USERS['sup_rekha'] : FALLBACK_USERS['aww_hansa']);
      const offlineToken = `offline_token_${username}_${Date.now()}`;
      setToken(offlineToken);
      setUser(fallback);
      localStorage.setItem('khorak_token', offlineToken);
      localStorage.setItem('khorak_user', JSON.stringify(fallback));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('khorak_token');
    localStorage.removeItem('khorak_user');
  };

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(path, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
