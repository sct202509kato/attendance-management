// src/components/attendance/MonthlyReportExport.tsx
import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

type BreakItem = { start: string; end: string | null };

export type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null;   // ISO
  clockOut: string | null;  // ISO
  breaks: BreakItem[];
};

type Props = {
  records: AttendanceRecord[];
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const minutesBetween = (startIso: string, endIso: string) =>
  Math.max(0, Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000));

const calcBreakMinutes = (breaks: BreakItem[]) => {
  let total = 0;
  for (const b of breaks) {
    if (b.start && b.end) total += minutesBetween(b.start, b.end);
  }
  return total;
};

const calcWorkMinutes = (r: AttendanceRecord) => {
  // 退勤前の集計は月次では除外（確定分だけ）
  if (!r.clockIn || !r.clockOut) return 0;
  const gross = minutesBetween(r.clockIn, r.clockOut);
  const brk = calcBreakMinutes(r.breaks);
  return Math.max(0, gross - brk);
};

const toTimeHHMM = (iso: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

const formatHM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${m}分`;
};

const MonthlyReportExport: React.FC<Props> = ({ records }) => {
  // 対象年月（初期：今月）
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const monthKey = `${year}-${pad2(month)}`; // YYYY-MM

  const monthRecords = useMemo(() => {
    return records
      .filter((r) => r.date.startsWith(monthKey))
      // 日付昇順
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [records, monthKey]);

  const summary = useMemo(() => {
    const settled = monthRecords.filter((r) => r.clockIn && r.clockOut); // 確定分だけ
    const workMinutesTotal = settled.reduce((sum, r) => sum + calcWorkMinutes(r), 0);
    const breakMinutesTotal = settled.reduce((sum, r) => sum + calcBreakMinutes(r.breaks), 0);
    const workDays = settled.length;
    const avgWorkMinutes = workDays > 0 ? Math.floor(workMinutesTotal / workDays) : 0;

    return { workDays, workMinutesTotal, breakMinutesTotal, avgWorkMinutes, settledCount: workDays };
  }, [monthRecords]);

  const handleExport = () => {
    // 明細（表）
    const rows = monthRecords.map((r) => {
      const breakMin = calcBreakMinutes(r.breaks);
      const workMin = calcWorkMinutes(r);
      return {
        日付: r.date,
        出勤: toTimeHHMM(r.clockIn),
        退勤: toTimeHHMM(r.clockOut),
        休憩分: breakMin,
        勤務分: workMin,
        休憩時間: formatHM(breakMin),
        勤務時間: formatHM(workMin),
        備考: r.clockOut ? '' : '※退勤未確定（集計対象外）',
      };
    });

    // サマリー（上に置く）
    const summaryRows = [
      { 項目: '対象年月', 値: `${year}年${month}月` },
      { 項目: '勤務日数（退勤確定）', 値: `${summary.workDays}日` },
      { 項目: '総勤務時間', 値: formatHM(summary.workMinutesTotal) },
      { 項目: '総休憩時間', 値: formatHM(summary.breakMinutesTotal) },
      { 項目: '平均勤務時間', 値: formatHM(summary.avgWorkMinutes) },
      { 項目: '注意', 値: '退勤未確定の行は集計に含めません' },
    ];

    // シート生成：サマリー→空行→明細
    const ws1 = XLSX.utils.json_to_sheet(summaryRows, { header: ['項目', '値'] });

    // 空行を挟む（サマリーの下にスペース）
    const startRow = summaryRows.length + 2;
    XLSX.utils.sheet_add_json(ws1, rows, { origin: `A${startRow}`, skipHeader: false });

    // 列幅（見やすさ）
    ws1['!cols'] = [
      { wch: 12 }, // 日付 or 項目
      { wch: 18 }, // 出勤 or 値
      { wch: 18 }, // 退勤
      { wch: 10 }, // 休憩分
      { wch: 10 }, // 勤務分
      { wch: 12 }, // 休憩時間
      { wch: 12 }, // 勤務時間
      { wch: 28 }, // 備考
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, `${pad2(month)}月レポート`);

    const filename = `勤怠月次レポート_${year}-${pad2(month)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-3">月次レポート</h2>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">年</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28 border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">月</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-20 border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={handleExport}
          className="ml-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          Excelで出力
        </button>
      </div>

      <div className="text-sm text-gray-700 space-y-1">
        <div>対象: <span className="font-semibold">{year}年{month}月</span></div>
        <div>勤務日数（退勤確定）: <span className="font-semibold">{summary.workDays}日</span></div>
        <div>総勤務時間: <span className="font-semibold">{formatHM(summary.workMinutesTotal)}</span></div>
        <div>総休憩時間: <span className="font-semibold">{formatHM(summary.breakMinutesTotal)}</span></div>
        <div>平均勤務時間: <span className="font-semibold">{formatHM(summary.avgWorkMinutes)}</span></div>
        <div className="text-xs text-gray-500 pt-2">
          ※退勤未確定のデータは集計に含めず、Excelの備考に表示します
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportExport;
