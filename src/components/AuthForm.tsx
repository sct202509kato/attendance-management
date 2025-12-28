import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";

const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    console.log("submit fired", { email, passwordLen: password.length });
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Authentication error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold">
          {mode === "signup" ? "新規登録" : "ログイン"}
        </h1>

        <div className="space-y-2">
          <input
            className="w-full border rounded p-2"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full border rounded p-2"
            placeholder="パスワード（6文字以上）"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          className="w-full bg-black text-white rounded p-2 disabled:opacity-50"
          onClick={submit}
          disabled={busy || !email || password.length < 6}
        >
          {busy ? "処理中..." : mode === "signup" ? "登録する" : "ログイン"}
        </button>

        <button
          className="w-full text-sm underline"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          disabled={busy}
        >
          {mode === "signup" ? "ログインに切り替え" : "新規登録に切り替え"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
