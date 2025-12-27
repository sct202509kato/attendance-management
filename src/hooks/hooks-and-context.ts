// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'types/user';
import { AuthService } from 'services/auth';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (loginId: string, password: string) => Promise<User | null>;
  register: (name: string, loginId: string, password: string, role: 'admin' | 'user') => Promise<User | null>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userList = await AuthService.getUsers();
      setUsers(userList);
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginId: string, password: string): Promise<User | null> => {
    const user = await AuthService.login(loginId, password);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  };

  const register = async (
    name: string,
    loginId: string,
    password: string,
    role: 'admin' | 'user'
  ): Promise<User | null> => {
    const user = await AuthService.register(name, loginId, password, role);
    if (user) {
      setCurrentUser(user);
      await loadUsers();
    }
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// src/hooks/useAttendance.ts
import { useState, useEffect } from 'react';
import { AttendanceRecord } from 'types/attendance';
import { AttendanceService } from 'services/attendance';

export const useAttendance = (userId: string | null) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadRecords();
    }
  }, [userId]);

  const loadRecords = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await AttendanceService.getUserRecords(userId);
      setRecords(data);

      const today = await AttendanceService.getTodayRecord(userId);
      setTodayRecord(today);
      setIsWorking(!!today?.clockIn && !today?.clockOut);
    } catch (error) {
      console.error('勤怠データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const clockIn = async () => {
    if (!userId) return false;

    const today = new Date().toDateString();
    const existing = records.find((r) => new Date(r.date).toDateString() === today);

    if (existing) {
      alert('本日は既に出勤打刻済みです');
      return false;
    }

    const newRecord: AttendanceRecord = {
      id: Date.now(),
      userId,
      date: new Date().toISOString(),
      clockIn: new Date().toISOString(),
      clockOut: null,
      breaks: [],
    };

    const success = await AttendanceService.saveRecord(userId, newRecord);
    if (success) {
      await loadRecords();
    }
    return success;
  };

  const clockOut = async () => {
    if (!userId || !todayRecord) return false;

    const updatedRecord = {
      ...todayRecord,
      clockOut: new Date().toISOString(),
    };

    const success = await AttendanceService.saveRecord(userId, updatedRecord);
    if (success) {
      await loadRecords();
    }
    return success;
  };

  const startBreak = async () => {
    if (!userId || !todayRecord || !isWorking) return false;

    const lastBreak = todayRecord.breaks[todayRecord.breaks.length - 1];
    if (lastBreak && !lastBreak.end) {
      alert('既に休憩中です');
      return false;
    }

    const updatedRecord = {
      ...todayRecord,
      breaks: [...todayRecord.breaks, { start: new Date().toISOString(), end: null }],
    };

    const success = await AttendanceService.saveRecord(userId, updatedRecord);
    if (success) {
      await loadRecords();
    }
    return success;
  };

  const endBreak = async () => {
    if (!userId || !todayRecord || !isWorking) return false;

    const lastBreak = todayRecord.breaks[todayRecord.breaks.length - 1];
    if (!lastBreak || lastBreak.end) {
      alert('休憩を開始していません');
      return false;
    }

    const updatedBreaks = [...todayRecord.breaks];
    updatedBreaks[updatedBreaks.length - 1].end = new Date().toISOString();

    const updatedRecord = {
      ...todayRecord,
      breaks: updatedBreaks,
    };

    const success = await AttendanceService.saveRecord(userId, updatedRecord);
    if (success) {
      await loadRecords();
    }
    return success;
  };

  const isOnBreak = todayRecord?.breaks.some((b) => b.start && !b.end) || false;

  return {
    records,
    todayRecord,
    isWorking,
    isOnBreak,
    loading,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    reload: loadRecords,
  };
};

// src/hooks/useCorrection.ts
import { useState, useEffect } from 'react';
import { CorrectionRequest } from 'types/correction';
import { CorrectionService } from 'services/correction';

export const useCorrection = (userId: string | null, isAdmin: boolean) => {
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [userId, isAdmin]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const all = await CorrectionService.getAll();
        setRequests(all);
      } else if (userId) {
        const userRequests = await CorrectionService.getUserRequests(userId);
        setRequests(userRequests);
      }
    } catch (error) {
      console.error('修正申請読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (request: CorrectionRequest): Promise<boolean> => {
    const success = await CorrectionService.save(request);
    if (success) {
      await loadRequests();
    }
    return success;
  };

  const processRequest = async (
    requestId: string,
    action: 'approve' | 'reject',
    currentUserId: string
  ): Promise<boolean> => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return false;

    if (action === 'approve' && request.originalRecord) {
      const updatedRecord = {
        ...request.originalRecord,
        clockIn: request.correctedClockIn || request.originalRecord.clockIn,
        clockOut: request.correctedClockOut || request.originalRecord.clockOut,
      };

      await AttendanceService.saveRecord(request.userId, updatedRecord);
    }

    const updatedRequest = {
      ...request,
      status: action === 'approve' ? 'approved' as const : 'rejected' as const,
      processedAt: new Date().toISOString(),
      processedBy: currentUserId,
    };

    const success = await CorrectionService.save(updatedRequest);
    if (success) {
      await loadRequests();
    }
    return success;
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return {
    requests,
    loading,
    pendingCount,
    submitRequest,
    processRequest,
    reload: loadRequests,
  };
};

// Import AttendanceService at the top of useCorrection.ts
import { AttendanceService } from 'services/attendance';