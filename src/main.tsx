import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App.tsx";
import "./index.css";

// Initialize Vercel Web Analytics on client side
inject();

// Initialize Vercel Speed Insights on client side
injectSpeedInsights();

createRoot(document.getElementById("root")!).render(<App />);
