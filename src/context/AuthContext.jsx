import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Obtener datos adicionales del usuario desde Firestore
        const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        const datos = snap.exists() ? snap.data() : {}
        setUsuario({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nombre: datos.nombre || firebaseUser.email,
          rol: datos.rol || 'EMPLEADO'
        })
      } else {
        setUsuario(null)
      }
      setCargando(false)
    })
    return unsub
  }, [])

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'usuarios', cred.user.uid))
    const datos = snap.exists() ? snap.data() : {}
    const u = {
      uid: cred.user.uid,
      email: cred.user.email,
      nombre: datos.nombre || email,
      rol: datos.rol || 'EMPLEADO'
    }
    setUsuario(u)
    return u
  }

  const logout = async () => {
    await signOut(auth)
    setUsuario(null)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAdmin: usuario?.rol === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
