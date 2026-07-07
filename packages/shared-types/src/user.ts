export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST',
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
  /** Opcional para contas criadas via SSO Google */
  cpf?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  hospitalId?: string;
  healthInsuranceId?: string;
  googleId?: string;
  avatarUrl?: string;
  emailVerifiedAt?: Date;
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

/** Credencial (ID token) retornada pelo Google Identity Services */
export interface GoogleLoginDTO {
  credential: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  /** true quando a conta foi criada e aguarda verificação de e-mail */
  requiresEmailVerification?: boolean;
}
