import { createContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // 🔥 Auth user
  const [profile, setProfile] = useState(null); // 🔥 Firestore user
  const [role, setRole] = useState(null);       // 🔥 Role
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser); // ✅ keep auth user

          // 🔥 fetch profile
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();

            setProfile(data);
            setRole(data.role);
          } else {
            console.warn("User doc not found");
            setProfile(null);
            setRole(null);
          }

        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error("AuthContext Error:", err);
        setProfile(null);
        setRole(null);
      } finally {
        setLoading(false); // ✅ always stop loading
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,       // firebase auth
        profile,    // firestore data
        role,       // role shortcut
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}