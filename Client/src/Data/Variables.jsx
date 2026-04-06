// 🚀 VERSION 1.1 - Forced Cache Bust
console.log("█████████████████████████████████████████████");
console.log("🗳️ E-VOTING SYSTEM BOOTING...");
console.log("🛠️ VERCEL DEPLOYMENT VERSION: 1.1 (CORS & Slash Fix)");

// 1. Get the base URL and strip any trailing slashes
let rootURL = (process.env.REACT_APP_SERVER_URL || "http://localhost:1322/").replace(/\/$/, "");

// 2. Clear redundant paths
rootURL = rootURL.replace(/\/api\/auth$/, "");

// 3. Export clean links
export const serverLink = `${rootURL}/api/auth/`;
export const facesLink = `${rootURL}/Faces/`;
export const clientLink = (process.env.REACT_APP_CLIENT_URL || "http://localhost:3000/").replace(/\/$/, "") + "/";

console.log("📡 CONNECTING TO BACKEND ->", serverLink);
console.log("📂 IMAGE STORAGE ->", facesLink);
console.log("█████████████████████████████████████████████");

export const phases = ["init", "voting", "result"];
export const isFaceRecognitionEnable = true;
export const isRegistrationOpen = true; // Enforces Registration Window
