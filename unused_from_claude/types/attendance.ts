// src/types/attendance.ts
export type BreakItem = {
  start: string;
  end: string | null;
};

export type AttendanceRecord = {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breaks: BreakItem[];
};
