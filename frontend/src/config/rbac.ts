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
  | 'DRAFTER'
  | 'HALAL_ADVISOR'
  | 'MARKETING'
  | 'AUDIT_MANAGER'
  | 'CLIENT'
  | 'FINANCE'
  | 'HALAL_MANAGER'
  | 'HALAL_DIRECTOR'
  | 'ADMIN_PELATIHAN'
  | 'ADMIN_KEUANGAN'
  | 'BUSINESS_DEVELOPMENT'
  | 'DRAFT_MANAGER';

/** Semua role yang ada — dipakai untuk "semua role bisa akses" */
export const ALL_ROLES: AppRole[] = [
  'DIRECTOR', 'MANAGER', 'QC_OFFICER', 'DRAFTER', 'HALAL_ADVISOR',
  'MARKETING', 'AUDIT_MANAGER', 'CLIENT', 'FINANCE',
  'HALAL_MANAGER', 'HALAL_DIRECTOR', 'ADMIN_PELATIHAN', 'ADMIN_KEUANGAN',
  'BUSINESS_DEVELOPMENT', 'DRAFT_MANAGER',
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
    'DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR',
    'DRAFTER', 'QC_OFFICER', 'MARKETING', 'AUDIT_MANAGER',
  ],
  'clients/new': [
    'DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR', 'MARKETING',
  ],
  // clients/:id  → sama dengan clients/new (edit)
  'submissions': [
    'DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR',
    'QC_OFFICER', 'DRAFTER', 'MARKETING', 'AUDIT_MANAGER', 'CLIENT',
  ],
  'submissions/new': [
    'DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR', 'MARKETING',
  ],
  // submissions/:id → sama dengan submissions

  // ── Tagihan ───────────────────────────────────────────────────────
  'my-invoices': [
    'HALAL_MANAGER', 'HALAL_DIRECTOR', 'HALAL_ADVISOR', 'MARKETING', 'FINANCE',
    'ADMIN_KEUANGAN', 'DIRECTOR',
  ],

  // ── Workflow ──────────────────────────────────────────────────────
  'distribution': [
    'QC_OFFICER', 'DIRECTOR', 'MANAGER', 'AUDIT_MANAGER',
  ],
  'monitoring': [
    'QC_OFFICER', 'DIRECTOR', 'MANAGER', 'AUDIT_MANAGER',
  ],
  'drafter-workspace': ['DRAFTER'],
  'qc-workspace':      ['QC_OFFICER', 'DIRECTOR'],
  'audit-manager-workspace': ['AUDIT_MANAGER', 'DIRECTOR'],
  'draft-monitoring':  ['DRAFT_MANAGER', 'DIRECTOR'],

  // ── Profil Advisor & Karir ────────────────────────────────────────
  'consultant-profile': ['HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR'],
  'karir':              ['HALAL_ADVISOR', 'HALAL_MANAGER'],

  // ── Jaringan & Referral ───────────────────────────────────────────
  'team':           ['HALAL_MANAGER', 'HALAL_DIRECTOR'],
  'referrals':      ['HALAL_ADVISOR', 'HALAL_MANAGER', 'HALAL_DIRECTOR', 'MARKETING', 'DIRECTOR'],
  'admin-referrals':['DIRECTOR', 'ADMIN_PELATIHAN', 'ADMIN_KEUANGAN'],
  'referral-fees':  ['DIRECTOR', 'ADMIN_KEUANGAN', 'ADMIN_PELATIHAN'],
  'coordinator-rates': ['DIRECTOR', 'ADMIN_KEUANGAN'],

  // ── Operasional ───────────────────────────────────────────────────
  'consultant-verification': ['DIRECTOR', 'ADMIN_PELATIHAN', 'HALAL_MANAGER', 'HALAL_DIRECTOR'],
  'training':       ['DIRECTOR', 'MANAGER', 'ADMIN_PELATIHAN', 'HALAL_MANAGER', 'HALAL_DIRECTOR'],
  'admin-promosi':  ['DIRECTOR', 'ADMIN_PELATIHAN'],

  // ── Pengaturan Sistem ─────────────────────────────────────────────
  'billing':        ['DIRECTOR', 'FINANCE', 'ADMIN_KEUANGAN'],
  'form-config':    ['DIRECTOR', 'MANAGER'],
  'billing-config': ['DIRECTOR', 'MANAGER', 'FINANCE', 'ADMIN_KEUANGAN'],
  'geography':      ['DIRECTOR', 'MANAGER', 'ADMIN_KEUANGAN'],
  'users':          ['DIRECTOR'],
  'notification-settings': ['DIRECTOR'],
  'cms':            ['DIRECTOR', 'MANAGER'],

  // ── Keuangan ────────────────────────────────────────────────────────
  'finance':               ['DIRECTOR', 'ADMIN_KEUANGAN', 'FINANCE'],
  'fee-config':            ['DIRECTOR', 'ADMIN_KEUANGAN'],
  'commission-management': ['DIRECTOR', 'ADMIN_KEUANGAN', 'FINANCE'],

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
