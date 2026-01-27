export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  HOSPITAL_ADMIN = 'HOSPITAL_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  HEALTH_INSURANCE_ADMIN = 'HEALTH_INSURANCE_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  cpf: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  hospitalId?: string;
  healthInsuranceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  cpf: string;
  phone: string;
  role: UserRole;
  hospitalId?: string;
  healthInsuranceId?: string;
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
  phone?: string;
  status?: UserStatus;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
