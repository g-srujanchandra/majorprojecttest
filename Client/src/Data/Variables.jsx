const baseServerLink = (process.env.REACT_APP_SERVER_URL || "http://localhost:1322/").replace(/\/$/, "");
export const serverLink = `${baseServerLink}/api/auth/`;
export const clientLink = (process.env.REACT_APP_CLIENT_URL || "http://localhost:3000/").replace(/\/$/, "") + "/";
export const facesLink = `${baseServerLink}/Faces/`;
export const phases = ["init", "voting", "result"];
export const isFaceRecognitionEnable = true;
export const isRegistrationOpen = true; // Enforces Registration Window
