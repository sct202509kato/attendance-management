// src/services/storage.ts
export class StorageService {
  static async get(key: string): Promise<any> {
    try {
      const result = await window.storage.get(key);
      if (result && result.value) {
        return JSON.parse(result.value);
      }
      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any): Promise<boolean> {
    try {
      await window.storage.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  static async list(prefix: string): Promise<string[]> {
    try {
      const result = await window.storage.list(prefix);
      return result?.keys || [];
    } catch (error) {
      console.error('Storage list error:', error);
      return [];
    }
  }

  static async delete(key: string): Promise<boolean> {
    try {
      await window.storage.delete(key);
      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      return false;
    }
  }
}

// src/services/auth.ts
import { User } from 'types/user';
import { StorageService } from './storage';
import { hashPassword } from 'utils/validation';

export class AuthService {
  static async getUsers(): Promise<User[]> {
    const users = await StorageService.get('system:users');
    return users || [];
  }

  static async saveUsers(users: User[]): Promise<boolean> {
    return await StorageService.set('system:users', users);
  }

  static async login(loginId: string, password: string): Promise<User | null> {
    const users = await this.getUsers();
    const user = users.find((u) => u.loginId === loginId);

    if (!user) return null;

    const hashedPassword = hashPassword(password);
    if (user.passwordHash !== hashedPassword) return null;

    await StorageService.set('system:lastUser', user.id);
    return user;
  }

  static async register(
    name: string,
    loginId: string,
    password: string,
    role: 'admin' | 'user'
  ): Promise<User | null> {
    const users = await this.getUsers();

    if (users.some((u) => u.loginId === loginId)) {
      return null;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      loginId: loginId.trim(),
      passwordHash: hashPassword(password),
      role,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    await this.saveUsers(updatedUsers);
    await StorageService.set('system:lastUser', newUser.id);

    return newUser;
  }

  static async getLastUser(): Promise<string | null> {
    return await StorageService.get('system:lastUser');
  }
}

// src/services/attendance.ts
import { AttendanceRecord } from 'types/attendance';
import { StorageService } from './storage';

export class AttendanceService {
  static async getUserRecords(userId: string): Promise<AttendanceRecord[]> {
    const keys = await StorageService.list(`attendance:${userId}:`);
    const records: AttendanceRecord[] = [];

    for (const key of keys) {
      const data = await StorageService.get(key);
      if (data) {
        records.push(data);
      }
    }

    return records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  static async saveRecord(userId: string, record: AttendanceRecord): Promise<boolean> {
    const key = `attendance:${userId}:${record.id}`;
    return await StorageService.set(key, record);
  }

  static async getTodayRecord(userId: string): Promise<AttendanceRecord | null> {
    const records = await this.getUserRecords(userId);
    const today = new Date().toDateString();
    return records.find((r) => new Date(r.date).toDateString() === today) || null;
  }
}

// src/services/correction.ts
import { CorrectionRequest } from 'types/correction';
import { StorageService } from './storage';

export class CorrectionService {
  static async getAll(): Promise<CorrectionRequest[]> {
    const keys = await StorageService.list('correction:');
    const requests: CorrectionRequest[] = [];

    for (const key of keys) {
      const data = await StorageService.get(key);
      if (data) {
        requests.push(data);
      }
    }

    return requests.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  static async save(request: CorrectionRequest): Promise<boolean> {
    const key = `correction:${request.id}`;
    return await StorageService.set(key, request);
  }

  static async getUserRequests(userId: string): Promise<CorrectionRequest[]> {
    const all = await this.getAll();
    return all.filter((r) => r.userId === userId);
  }

  static async getPendingCount(): Promise<number> {
    const all = await this.getAll();
    return all.filter((r) => r.status === 'pending').length;
  }
}

// src/services/export.ts
import * as XLSX from 'xlsx';
import { AttendanceRecord } from 'types/attendance';
import { User } from 'types/user';
import { calculateWorkTime, formatDuration } from 'utils/timeCalculation';
import { formatTime, formatDate } from 'utils/dateFormat';
import { AttendanceService } from './attendance';

export class ExportService {
  static async exportMonthlyReport(
    users: User[],
    year: number,
    month: number
  ): Promise<void> {
    const allRecords: (AttendanceRecord & { userName: string })[] = [];

    for (const user of users) {
      const records = await AttendanceService.getUserRecords(user.id);
      const filtered = records.filter((r) => {
        const date = new Date(r.date);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });

      allRecords.push(...filtered.map((r) => ({ ...r, userName: user.name })));
    }

    if (allRecords.length === 0) {
      throw new Error('指定された月のデータがありません');
    }

    const excelData = allRecords.map((record) => ({
      '氏名': record.userName,
      '日付': formatDate(record.date),
      '出勤時刻': record.clockIn ? formatTime(record.clockIn) : '-',
      '退勤時刻': record.clockOut ? formatTime(record.clockOut) : '-',
      '休憩回数': record.breaks.filter((b) => b.end).length,
      '勤務時間（分）': Math.floor(calculateWorkTime(record)),
      '勤務時間': formatDuration(calculateWorkTime(record)),
    }));

    const userSummary: Record<string, { totalDays: number; totalMinutes: number }> = {};
    allRecords.forEach((record) => {
      if (!userSummary[record.userName]) {
        userSummary[record.userName] = { totalDays: 0, totalMinutes: 0 };
      }
      userSummary[record.userName].totalDays += 1;
      userSummary[record.userName].totalMinutes += calculateWorkTime(record);
    });

    const summaryData = Object.entries(userSummary).map(([name, data]) => ({
      '氏名': name,
      '出勤日数': data.totalDays,
      '総勤務時間（分）': Math.floor(data.totalMinutes),
      '総勤務時間': formatDuration(data.totalMinutes),
      '平均勤務時間': formatDuration(data.totalMinutes / data.totalDays),
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws1, '勤怠詳細');

    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, '月次集計');

    const fileName = `勤怠レポート_${year}年${month}月.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}