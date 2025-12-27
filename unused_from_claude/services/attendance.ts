// src/services/attendance.ts
import { AttendanceRecord } from '../types/attendance';

export const calcWorkMinutes = (r: AttendanceRecord): number => {
  if (!r.clockIn || !r.clockOut) return 0;
  // 今あるロジックをそのまま移す
  return 0;
};
