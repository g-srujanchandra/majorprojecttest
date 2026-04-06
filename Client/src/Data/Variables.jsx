// 1. Get the base URL and strip any trailing slashes
let rootURL = (process.env.REACT_APP_SERVER_URL || "http://localhost:1322/").replace(/\/$/, "");

// 2. Clear redundant paths
rootURL = rootURL.replace(/\/api\/auth$/, "");

// 3. Export clean links
export const serverLink = `${rootURL}/api/auth/`;
export const facesLink = `${rootURL}/Faces/`;
export const clientLink = (process.env.REACT_APP_CLIENT_URL || "http://localhost:3000/").replace(/\/$/, "") + "/";

// 🛡️ SELF-CONNECTION SHIELD: Detect if the user pointed the backend to the frontend URL
if (typeof window !== "undefined" && serverLink.includes(window.location.hostname)) {
  console.error("⛔ CONFIG ERROR: Your REACT_APP_SERVER_URL is pointing to your frontend (Vercel) instead of your backend (Railway)!");
}

export const phases = ["init", "voting", "result"];
export const isFaceRecognitionEnable = true;
export const isRegistrationOpen = true; // Enforces Registration Window
