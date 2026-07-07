// Tipos da plataforma Acolhe: geolocalização, elegibilidade, white-label, TISS e LGPD

// ── Recomendação de unidades por geolocalização ────────────────────────────

export interface NearbyHospitalQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  specialty?: string;
  healthInsuranceId?: string;
  limit?: number;
}

export interface NearbyHospital {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  estimatedWaitTime: number;
  totalWaiting: number;
  acceptsInsurance: boolean;
  emergency24h: boolean;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  specialties: string[];
  /** Score combinado de distância + fila (menor = melhor recomendação) */
  recommendationScore: number;
  mapsUrl: string;
  wazeUrl: string;
}

// ── Elegibilidade junto à operadora ────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  checkedAt: Date;
  healthInsuranceId?: string;
  healthInsuranceName?: string;
  planName?: string;
  coPayment?: number;
  reasons: string[];
}

// ── White-label (B2B) ──────────────────────────────────────────────────────

export interface BrandingConfig {
  id: string;
  slug: string;
  displayName: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  hospitalId?: string;
  healthInsuranceId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertBrandingDTO {
  slug: string;
  displayName: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  hospitalId?: string;
  healthInsuranceId?: string;
  active?: boolean;
}

// ── Prontuário eletrônico integrado (padrão TISS) ──────────────────────────

export interface TussProcedure {
  code: string;
  description: string;
  quantity: number;
}

export interface TissGuide {
  guideNumber: string;
  guideType: 'CONSULTA' | 'SP_SADT' | 'INTERNACAO';
  issuedAt: Date;
  provider: {
    cnpj: string;
    name: string;
  };
  beneficiary: {
    name: string;
    cpf: string;
    healthInsuranceNumber?: string;
    healthInsuranceName?: string;
  };
  professional: {
    name: string;
  };
  attendance: {
    date: Date;
    specialty: string;
    cid10?: string;
    reason: string;
    diagnosis?: string;
  };
  procedures: TussProcedure[];
}

// ── LGPD ───────────────────────────────────────────────────────────────────

export interface ConsentDTO {
  lgpdConsent: boolean;
  lgpdConsentVersion?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
