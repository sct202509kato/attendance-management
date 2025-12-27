// src/utils/dateFormat.ts
export const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('ja-JP');
};

export const formatDateTime = (isoString: string): string => {
  return new Date(isoString).toLocaleString('ja-JP');
};

export const formatTimeForInput = (isoString: string | null): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// src/utils/timeCalculation.ts
import { AttendanceRecord } from 'types/attendance';

export const calculateWorkTime = (record: AttendanceRecord): number => {
  if (!record.clockIn) return 0;

  const start = new Date(record.clockIn);
  const end = record.clockOut ? new Date(record.clockOut) : new Date();
  let workMinutes = (end.getTime() - start.getTime()) / 1000 / 60;

  record.breaks.forEach((b) => {
    if (b.start && b.end) {
      const breakStart = new Date(b.start);
      const breakEnd = new Date(b.end);
      workMinutes -= (breakEnd.getTime() - breakStart.getTime()) / 1000 / 60;
    }
  });

  return Math.max(0, workMinutes);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}時間${mins}分`;
};

// src/utils/validation.ts
export const validateLoginId = (id: string): string | null => {
  if (!id.trim()) return 'ログインIDを入力してください';
  if (id.length < 4) return 'ログインIDは4文字以上で設定してください';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'パスワードを入力してください';
  if (password.length < 6) return 'パスワードは6文字以上で設定してください';
  return null;
};

export const validatePasswordMatch = (
  password: string,
  confirm: string
): string | null => {
  if (password !== confirm) return 'パスワードが一致しません';
  return null;
};

export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};