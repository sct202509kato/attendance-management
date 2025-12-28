// src/App.tsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import AuthForm from "./components/AuthForm";
import AttendanceApp from "./AttendanceApp";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  if (authLoading) return <div className="p-4">Loading...</div>;
  if (!user) return <AuthForm />;

  return <AttendanceApp user={user} />;
};

export default App;
