import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

// On Vercel: set VITE_API_BASE_URL to your deployed API server URL
// On Replit: leave unset — relative URLs work via the reverse proxy
setBaseUrl((import.meta.env.VITE_API_BASE_URL as string) ?? null);

// Automatically inject Bearer token for every API call
setAuthTokenGetter(() => localStorage.getItem("codebuddy_token"));

createRoot(document.getElementById("root")!).render(<App />);
