# 勤怠管理アプリ（Attendance Management App）

React + TypeScript で作成した、シンプルな勤怠管理アプリです。  
出勤・休憩・退勤の打刻、勤怠履歴の表示、月次レポート（Excel出力）ができます。

---

## 🔖 概要

- 出勤／休憩開始／休憩終了／退勤の打刻
- 本日の勤務状況をリアルタイム表示
- 勤怠履歴の一覧表示
- 月次勤怠レポートを **Excel（.xlsx）形式で出力**
- localStorage を利用した状態保持（リロードしてもデータ保持）

※ 現在はフロントエンドのみ（DB未使用）

---

## 🖥️ 主な機能

### 一般ユーザー向け
- 出勤・退勤の打刻
- 休憩の開始・終了
- 本日の勤務時間・休憩時間の確認
- 勤怠履歴の確認
- 月次レポートのExcel出力

### 管理者向け（今後実装予定）
- 全ユーザーの勤怠確認
- 勤怠修正申請の承認

---

## 🛠 使用技術

- **React**
- **TypeScript**
- **Tailwind CSS**
- **xlsx**（Excel出力）
- localStorage（状態管理・永続化）

---




## 📸 スクリーンショット

### トップ画面
![トップ画面](screenshots/top.png)

### 勤怠履歴
![勤怠履歴](screenshots/attendance.png)

### 月次レポート（Excel出力）
![月次レポート](screenshots/monthly-report.png)
※ 画面はローカル開発環境での表示です。

