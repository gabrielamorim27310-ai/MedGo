export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth: Date;
  bloodType?: BloodType;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  healthInsuranceId?: string;
  healthInsuranceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientDTO {
  userId: string;
  dateOfBirth: Date;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  healthInsuranceId?: string;
  healthInsuranceNumber?: string;
}

export interface UpdatePatientDTO {
  dateOfBirth?: Date;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  healthInsuranceId?: string;
  healthInsuranceNumber?: string;
}
