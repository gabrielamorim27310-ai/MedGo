export enum QueuePriority {
  EMERGENCY = 'EMERGENCY',
  URGENT = 'URGENT',
  SEMI_URGENT = 'SEMI_URGENT',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export enum QueueStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface QueueEntry {
  id: string;
  hospitalId: string;
  patientId: string;
  priority: QueuePriority;
  status: QueueStatus;
  specialty: string;
  symptoms: string;
  estimatedWaitTime?: number;
  position?: number;
  checkInTime: Date;
  startTime?: Date;
  endTime?: Date;
  doctorId?: string;
  roomNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Optional relations (when included in API response)
  patient?: {
    id: string;
    user?: {
      name: string;
      email?: string;
    };
  };
  hospital?: {
    id: string;
    name: string;
  };
}

export interface CreateQueueEntryDTO {
  hospitalId: string;
  patientId: string;
  priority: QueuePriority;
  specialty: string;
  symptoms: string;
}

export interface UpdateQueueEntryDTO {
  priority?: QueuePriority;
  status?: QueueStatus;
  estimatedWaitTime?: number;
  position?: number;
  startTime?: Date;
  endTime?: Date;
  doctorId?: string;
  roomNumber?: string;
  notes?: string;
}

export interface QueueStatistics {
  hospitalId: string;
  totalWaiting: number;
  averageWaitTime: number;
  byPriority: {
    [key in QueuePriority]: number;
  };
  bySpecialty: {
    [specialty: string]: number;
  };
  timestamp: Date;
}
