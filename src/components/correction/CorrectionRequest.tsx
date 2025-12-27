// src/components/correction/CorrectionRequest.tsx
import React, { useState } from 'react';
import { Clock, FileText, Calendar } from 'lucide-react';

const CorrectionRequest: React.FC = () => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 将来ここでAPI送信
    console.log({
      date,
      startTime,
      endTime,
      reason,
    });

    alert('修正申請（仮）を送信しました');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6 max-w-lg">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FileText className="text-indigo-600" />
        勤怠修正申請
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 日付 */}
        <div>
          <label className="block text-sm font-semibold mb-1">対象日</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 出勤時間 */}
        <div>
          <label className="block text-sm font-semibold mb-1">出勤時間</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* 退勤時間 */}
        <div>
          <label className="block text-sm font-semibold mb-1">退勤時間</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* 理由 */}
        <div>
          <label className="block text-sm font-semibold mb-1">修正理由</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            placeholder="打刻漏れのため など"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 送信 */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            修正申請する
          </button>
        </div>
      </form>
    </div>
  );
};

export default CorrectionRequest;
