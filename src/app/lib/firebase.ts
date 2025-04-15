import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
    apiKey: "AIzaSyBKHd8XL0d3cEqaYjPUNdvx9ZZyl4O1FVk",
    authDomain: "todolistmanda.firebaseapp.com",
    projectId: "todolistmanda",
    storageBucket: "todolistmanda.firebasestorage.app",
    messagingSenderId: "1026740881844",
    appId: "1:1026740881844:web:65756ae68c908dfad84ae1",
    measurementId: "G-YGQY9XSLD8"
  };

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
