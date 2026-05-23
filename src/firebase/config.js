import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCvxarBURKGelrGL5xCjuS_l7BysK44SKc",
  authDomain: "hardwarehub-pos.firebaseapp.com",
  projectId: "hardwarehub-pos",
  storageBucket: "hardwarehub-pos.appspot.com",
  messagingSenderId: "238919797208",
  appId: "1:238919797208:web:d566d74ae45d8a91228aad",
  measurementId: "G-ZK1X3ZQ5QK"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export default app