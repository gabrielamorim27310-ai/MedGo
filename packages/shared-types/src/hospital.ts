export enum HospitalType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  MIXED = 'MIXED',
}

export enum HospitalStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export interface Hospital {
  id: string;
  name: string;
  cnpj: string;
  type: HospitalType;
  status: HospitalStatus;

  // Address (flat fields matching Prisma schema)
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;

  // Contact
  phone: string;
  email: string;
  website?: string;

  specialties: string[];

  // Capacity
  totalBeds: number;
  emergencyBeds: number;
  icuBeds: number;

  // Current Occupancy
  occupiedBeds: number;
  occupiedEmergencyBeds: number;
  occupiedIcuBeds: number;

  // Computed available beds
  availableBeds?: number;

  acceptedHealthInsurances: string[];

  // Operating Hours
  emergency24h: boolean;
  operatingHours?: Record<string, { open: string; close: string }>;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHospitalDTO {
  name: string;
  cnpj: string;
  type: HospitalType;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  specialties: string[];
  totalBeds: number;
  emergencyBeds: number;
  icuBeds: number;
  acceptedHealthInsurances?: string[];
  emergency24h: boolean;
  operatingHours?: Record<string, { open: string; close: string }>;
}

export interface UpdateHospitalDTO {
  name?: string;
  status?: HospitalStatus;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  specialties?: string[];
  totalBeds?: number;
  emergencyBeds?: number;
  icuBeds?: number;
  occupiedBeds?: number;
  occupiedEmergencyBeds?: number;
  occupiedIcuBeds?: number;
  acceptedHealthInsurances?: string[];
  emergency24h?: boolean;
  operatingHours?: Record<string, { open: string; close: string }>;
}
