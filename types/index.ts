export type LiturgyStatus = 'held' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type AssignmentStatus = 'planned' | 'done' | 'skipped';
export type PartCategory = 'reading' | 'response' | 'service' | 'seasonal';
export type PartScope = 'general' | 'feast';

export interface Deacon {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  joinedDate?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
}

export interface Feast {
  id: string;
  arName: string;
  sortOrder: number;
  isSeeded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Part {
  id: string;
  arName: string;
  category: PartCategory;
  scope: PartScope;
  sortOrder: number;
  isActive: boolean;
  isSeeded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Liturgy {
  id: string;
  date: string;
  feastId?: string;
  title?: string;
  notes?: string;
  status: LiturgyStatus;
  cancellationReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRecord {
  liturgyId: string;
  deaconId: string;
  status: AttendanceStatus;
  note?: string;
  markedAt: number;
}

export interface Assignment {
  liturgyId: string;
  partId: string;
  deaconId: string;
  status: AssignmentStatus;
  note?: string;
  assignedAt: number;
}

export interface AttendanceCounts {
  present: number;
  absent: number;
  excused: number;
  unmarked: number;
}

export interface DeaconStats {
  deacon: Deacon;
  liturgiesEligible: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
  assignmentsCount: number;
  /** Per-part: how many times this deacon has done that part. */
  perPart: Array<{ partId: string; partName: string; count: number; lastDate?: string }>;
  lastAttendedDate?: string;
}

