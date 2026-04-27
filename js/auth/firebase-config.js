// Replace these placeholders with your Firebase project's web app config.
// Firebase Console -> Project settings -> General -> Your apps -> Web app.
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export function isFirebaseConfigReady() {
  const required = ["apiKey", "authDomain", "projectId", "appId"];
  return required.every((k) => {
    const v = firebaseConfig[k];
    return typeof v === "string" && v.length > 0 && !v.startsWith("YOUR_");
  });
}
