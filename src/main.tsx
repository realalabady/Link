import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Expose debug functions for console use
import { fixProviderDisplayName, getUserDocument, createProviderProfile } from "./lib/firestore";
(window as any).fixProviderDisplayName = fixProviderDisplayName;
(window as any).getUserDocument = getUserDocument;
(window as any).createProviderProfile = createProviderProfile;

createRoot(document.getElementById("root")!).render(<App />);
