// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDW6_2ntwzVgWz9OEPtY5xh7yix_Ec0y28",
    authDomain: "barbershopbooking-ff17d.firebaseapp.com",
    projectId: "barbershopbooking-ff17d",
    storageBucket: "barbershopbooking-ff17d.firebasestorage.app",
    messagingSenderId: "248162139374",
    appId: "1:248162139374:web:faabba98a417c14e8d87ff",
    measurementId: "G-WH0ZE5HF0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);