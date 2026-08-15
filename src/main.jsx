import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { TerminalProvider } from "./context/TerminalContext";
import "./styles/index.css";

/* Provider order matters: TerminalProvider calls useNavigate and
   useTheme, so it has to sit inside both the router and the theme. */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <TerminalProvider>
            <App />
          </TerminalProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
