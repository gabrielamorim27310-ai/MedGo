export enum AppointmentType {
  IN_PERSON = 'IN_PERSON',
  TELEMEDICINE = 'TELEMEDICINE',
  EMERGENCY = 'EMERGENCY',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export interface Appointment {
  id: string;
  hospitalId: string;
  patientId: string;
  doctorId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  specialty: string;
  scheduledDate: Date;
  duration: number;
  roomNumber?: string;
  telemedicineLink?: string;
  reason: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  queueEntryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentDTO {
  hospitalId: string;
  patientId: string;
  doctorId: string;
  type: AppointmentType;
  specialty: string;
  scheduledDate: Date;
  duration: number;
  reason: string;
  queueEntryId?: string;
}

export interface UpdateAppointmentDTO {
  status?: AppointmentStatus;
  scheduledDate?: Date;
  duration?: number;
  roomNumber?: string;
  telemedicineLink?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
}

export interface AppointmentAvailability {
  doctorId: string;
  date: Date;
  availableSlots: {
    startTime: Date;
    endTime: Date;
  }[];
}
