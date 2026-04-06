import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCvD-CostvKcda6qqk-rsdgBbp0wkpwXMo",
  authDomain: "renta-car-melgar.firebaseapp.com",
  projectId: "renta-car-melgar",
  storageBucket: "renta-car-melgar.firebasestorage.app",
  messagingSenderId: "165489828857",
  appId: "1:165489828857:web:346450b2bce19898d35328"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
