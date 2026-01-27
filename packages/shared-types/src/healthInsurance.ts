export enum HealthInsuranceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum CoverageType {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  FULL = 'FULL',
}

export interface HealthInsurance {
  id: string;
  name: string;
  cnpj: string;
  status: HealthInsuranceStatus;
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  plans: HealthInsurancePlan[];
  partnerHospitals: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthInsurancePlan {
  id: string;
  healthInsuranceId: string;
  name: string;
  code: string;
  coverageType: CoverageType;
  coverageDetails: {
    emergencyRoom: boolean;
    hospitalization: boolean;
    surgery: boolean;
    exams: boolean;
    telemedicine: boolean;
    specialties: string[];
  };
  monthlyPrice: number;
  coPayment: {
    consultation: number;
    exam: number;
    emergency: number;
  };
  status: HealthInsuranceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHealthInsuranceDTO {
  name: string;
  cnpj: string;
  contact: HealthInsurance['contact'];
  address: HealthInsurance['address'];
  partnerHospitals?: string[];
}

export interface UpdateHealthInsuranceDTO {
  name?: string;
  status?: HealthInsuranceStatus;
  contact?: Partial<HealthInsurance['contact']>;
  address?: Partial<HealthInsurance['address']>;
  partnerHospitals?: string[];
}

export interface CreateHealthInsurancePlanDTO {
  healthInsuranceId: string;
  name: string;
  code: string;
  coverageType: CoverageType;
  coverageDetails: HealthInsurancePlan['coverageDetails'];
  monthlyPrice: number;
  coPayment: HealthInsurancePlan['coPayment'];
}

export interface UpdateHealthInsurancePlanDTO {
  name?: string;
  coverageType?: CoverageType;
  coverageDetails?: Partial<HealthInsurancePlan['coverageDetails']>;
  monthlyPrice?: number;
  coPayment?: Partial<HealthInsurancePlan['coPayment']>;
  status?: HealthInsuranceStatus;
}
