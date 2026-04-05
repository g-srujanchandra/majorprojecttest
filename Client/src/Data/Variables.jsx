// 1. Get the base URL and strip any trailing slashes
let rootURL = (process.env.REACT_APP_SERVER_URL || "http://localhost:1322/").replace(/\/$/, "");

// 2. If the user already included '/api/auth' in their env variable, strip it so we can add it back cleanly
rootURL = rootURL.replace(/\/api\/auth$/, "");

// 3. Export the final links
export const serverLink = `${rootURL}/api/auth/`;
export const clientLink = (process.env.REACT_APP_CLIENT_URL || "http://localhost:3000/").replace(/\/$/, "") + "/";
export const facesLink = `${rootURL}/Faces/`;

console.log("🛠️ DIAGNOSTIC: Server Link is set to ->", serverLink);
console.log("🛠️ DIAGNOSTIC: Faces Link is set to ->", facesLink);

export const phases = ["init", "voting", "result"];
export const isFaceRecognitionEnable = true;
export const isRegistrationOpen = true; // Enforces Registration Window
