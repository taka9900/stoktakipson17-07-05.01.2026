// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// 🔐 SENİN CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyATqEqYWYEL-EZy4v8E3fw-fYNIDmWpjvc",
  authDomain: "stoktakip-c4c51.firebaseapp.com",
  databaseURL: "https://stoktakip-c4c51-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stoktakip-c4c51",
  storageBucket: "stoktakip-c4c51.firebasestorage.app",
  messagingSenderId: "341724317170",
  appId: "1:341724317170:web:746ea3fefa38e190dc976b",
  measurementId: "G-GCSHPXVCPK"
};

// 🔥 Firebase init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ===============================
// ⬇⬇⬇ KRİTİK KISIM ⬇⬇⬇
// React/Babel'in aradığı fonksiyonlar
// ===============================

window.handleLogin = function (email, password) {
  console.log("Login deneniyor:", email);
  return signInWithEmailAndPassword(auth, email, password);
};

window.handleLogout = function () {
  return signOut(auth);
};

// Global erişim (gerekirse)
window.auth = auth;
window.currentUser = null;

// Auth state listener
onAuthStateChanged(auth, (user) => {
  window.currentUser = user;
  console.log("AUTH STATE:", user ? user.email : "Çıkış yapıldı");
});
