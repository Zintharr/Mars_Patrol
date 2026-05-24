import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import StewardApp from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StewardApp />
  </StrictMode>
);
