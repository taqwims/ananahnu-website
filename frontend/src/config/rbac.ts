/**
 * RBAC (Role-Based Access Control) Configuration
 *
 * Sumber kebenaran tunggal untuk semua hak akses per role.
 * Digunakan oleh:
 *  - App.tsx  → RoleRoute (proteksi route)
 *  - Sidebar  → filter menu yang tampil
 *
 * Role yang ada di sistem:
 *  DIRECTOR, MANAGER, QC_OFFICER, DRAFTER, HALAL_ADVISOR,
 *  MARKETING, AUDIT_MANAGER, CLIENT, FINANCE,
 *  HALAL_MANAGER, HALAL_DIRECTOR, ADMIN_PELATIHAN, ADMIN_KEUANGAN,
 *  BUSINESS_DEVELOPMENT, DRAFT_MANAGER
 */

export type AppRole =
  | 'DIRECTOR'
  | 'MANAGER'
  | 'QC_OFFICER'
  | 'VERIFIKATOR'
  | 'DRAFTER'
  | 'HALAL_ADVISOR'
  | 'MARKETING'
  | 'CLIENT'
  | 'HALAL_MANAGER'
  | 'HALAL_DIRECTOR'
  | 'ADMIN_PELATIHAN'
  | 'ADMIN_KEUANGAN'
  | 'BUSINESS_DEVELOPMENT'
  | 'DRAFT_MANAGER'
  | 'FINANCE'
  | 'LEGAL';

/** Semua role yang ada — dipakai untuk "semua role bisa akses" */
export const ALL_ROLES: AppRole[] = [
  'DIRECTOR', 'MANAGER', 'QC_OFFICER', 'VERIFIKATOR', 'DRAFTER', 'HALAL_ADVISOR',
  'MARKETING', 'CLIENT',
  'HALAL_MANAGER', 'HALAL_DIRECTOR', 'ADMIN_PELATIHAN', 'ADMIN_KEUANGAN',
  'BUSINESS_DEVELOPMENT', 'DRAFT_MANAGER', 'FINANCE', 'LEGAL',
];

/**
 * Peta akses per path dashboard.
 * Key  = path relatif dari /dashboard (tanpa leading slash)
 * Value = array role yang boleh mengakses. undefined = semua role.
 *
 * Aturan:
 *  - Jika role tidak ada di array → redirect ke /dashboard (home)
 *  - "clients/:id" dan "submissions/:id" mengikuti aturan parent-nya
 */
export const PAGE_ROLES: Record<string, AppRole[]> = {
  // ── Semua role bisa akses ──────────────────────────────────────────
  '':                       ALL_ROLES,   // /dashboard (home)
  'profile':                ALL_ROLES,
  'estimasi':               ['DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'MARKETING', 'HALAL_MANAGER', 'HALAL_DIRECTOR'],

  // ── Klien & Pengajuan ─────────────────────────────────────────────
  'clients': [
    'DIRECTOR', 'MANAGER', 'HALAL_DIRECTOR',
    'DRAFTER', 'QC_OFFICER', 'VERIFIKATOR', 'MARKETING',
  ],
  'clients/new': [
    'DIRECTOR', 'MANAGER', 'HALAL_DIRECTOR', 'MARKETING',
  ],
  // clients/:id  → sama dengan clients/new (edit)
  'submissions': [
    'DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR',
    'QC_OFFICER', 'VERIFIKATOR', 'DRAFTER', 'MARKETING', 'CLIENT', 'BUSINESS_DEVELOPMENT',
  ],
  'submissions/new': [
    'DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR', 'MARKETING', 'BUSINESS_DEVELOPMENT',
  ],
  // submissions/:id → sama dengan submissions

  // ── Tagihan ───────────────────────────────────────────────────────
  'my-invoices': [
    'DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR', 'MARKETING', 'CLIENT', 'ADMIN_KEUANGAN',
  ],

  // ── Workflow ──────────────────────────────────────────────────────
  'distribution': [
    'QC_OFFICER', 'VERIFIKATOR', 'DIRECTOR', 'MANAGER',
  ],
  'monitoring': [
    'QC_OFFICER', 'VERIFIKATOR', 'DIRECTOR', 'MANAGER',
  ],
  'sh-workspace':      ['FINANCE', 'ADMIN_KEUANGAN', 'LEGAL', 'DIRECTOR', 'MANAGER'],
  'drafter-workspace': ['DRAFTER'],
  'qc-workspace':      ['QC_OFFICER', 'VERIFIKATOR', 'DIRECTOR'],
  'draft-monitoring':  ['DRAFT_MANAGER', 'DIRECTOR'],
  'advisors':          ['QC_OFFICER', 'VERIFIKATOR', 'DIRECTOR', 'MANAGER', 'HALAL_MANAGER', 'HALAL_DIRECTOR'],

  // ── Profil Advisor & Karir ────────────────────────────────────────
  'consultant-profile': ['HALAL_DIRECTOR'],
  'karir':              ['HALAL_ADVISOR', 'HALAL_MANAGER'],

  // ── Jaringan & Referral ───────────────────────────────────────────
  'team':           ['HALAL_MANAGER', 'HALAL_DIRECTOR'],
  'referrals':      ['HALAL_MANAGER', 'HALAL_DIRECTOR', 'MARKETING', 'DIRECTOR'],
  'admin-referrals':['DIRECTOR', 'ADMIN_KEUANGAN'],
  'referral-fees':  ['DIRECTOR', 'ADMIN_KEUANGAN'],
  'coordinator-rates': ['DIRECTOR', 'ADMIN_KEUANGAN'],

  // ── Operasional ───────────────────────────────────────────────────
  'consultant-verification': ['DIRECTOR', 'ADMIN_PELATIHAN', 'HALAL_MANAGER', 'HALAL_DIRECTOR'],
  'training':       ['DIRECTOR', 'MANAGER', 'ADMIN_PELATIHAN', 'HALAL_MANAGER', 'HALAL_DIRECTOR'],
  'admin-promosi':  ['DIRECTOR', 'ADMIN_PELATIHAN'],

  // ── Pengaturan Sistem ─────────────────────────────────────────────
  'billing':        ['DIRECTOR', 'ADMIN_KEUANGAN'],
  'form-config':    ['DIRECTOR', 'MANAGER'],
  'billing-config': ['DIRECTOR', 'MANAGER', 'ADMIN_KEUANGAN'],
  'geography':      ['DIRECTOR', 'MANAGER', 'ADMIN_KEUANGAN'],
  'users':          ['DIRECTOR'],
  'notification-settings': ['DIRECTOR'],
  'cms':            ['DIRECTOR', 'MANAGER'],

  // ── Keuangan ────────────────────────────────────────────────────────
  'finance':               ['DIRECTOR', 'ADMIN_KEUANGAN'],
  'fee-config':            ['DIRECTOR', 'ADMIN_KEUANGAN'],
  'commission-management': ['DIRECTOR', 'ADMIN_KEUANGAN'],

  // ── Business Development ───────────────────────────────────────────
  'bizdev':                ['DIRECTOR', 'BUSINESS_DEVELOPMENT'],

  // ── SPH ────────────────────────────────────────────────────────────
  'sph':                   ['DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR', 'ADMIN_KEUANGAN'],
};

/**
 * Cek apakah role boleh mengakses path tertentu.
 * Path yang tidak terdaftar di PAGE_ROLES dianggap TIDAK BOLEH diakses
 * (fail-closed / deny-by-default) untuk mencegah privilege escalation.
 */
export function canAccess(role: string, path: string): boolean {
  const allowed = PAGE_ROLES[path];
  // Path tidak terdaftar → tolak akses (deny-by-default)
  if (!allowed) return false;
  return allowed.includes(role as AppRole);
}
