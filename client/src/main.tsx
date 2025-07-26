import { createRoot } from "react-dom/client";
import App from "./App";
import { authManager } from "./lib/auth";
import "./index.css";

// Initialize auth manager before rendering the app
authManager.initialize();

createRoot(document.getElementById("root")!).render(<App />);
