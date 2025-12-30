# Attendance Management App

React + TypeScript + Firebase を用いて開発した勤怠管理Webアプリです。  
フロントエンドから認証・データ管理・セキュリティまでを一通り実装しています。

## Demo
https://attendance-management-zl2n.onrender.com

## 画面イメージ
![トップ画面](screenshots/top.png)

## 概要
個人利用を想定した勤怠管理アプリです。  
ユーザーはメールアドレスとパスワードで新規登録・ログインし、
出勤・退勤・休憩の打刻を行うことができます。

認証には Firebase Authentication、データ管理には Firestore を使用し、
ユーザーごとにデータを安全に分離しています。

## 主な機能
- メールアドレス / パスワードによるユーザー認証
- 出勤 / 退勤の打刻
- 休憩開始 / 休憩終了
- 日付ごとの勤怠履歴表示
- 月次レポートの確認
- Firestore を用いたユーザーごとのデータ管理

## 使用技術
- React
- TypeScript
- Firebase Authentication
- Firebase Firestore
- Tailwind CSS

## データ構成
users/{uid}/attendanceRecords/{recordId}

- 勤怠データはユーザー単位で分離して管理
- Firestore Security Rules により、認証済みユーザー本人のみが読み書き可能

## 設計・実装で工夫した点
- Firebase Authentication に認証情報を集約し、パスワードをアプリ側で保持しない安全な構成
- Firestore のデータ構造をユーザー単位に分離し、権限管理を明確化
- UTC と JST のズレを考慮し、ローカル日付（JST）を基準に日付キーを設計
- 勤務中 / 休憩中 / 退勤済みといった状態をロジックと UI の両面で整合性を保つよう設計

## 今後の拡張予定
- 管理者ユーザーと一般ユーザーの権限分離
- 勤怠修正申請・承認フローの実装
- 管理者による勤怠データの確認・修正機能



