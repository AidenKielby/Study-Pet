import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import ReactGA from "react-ga4";

const root = document.getElementById("root");
ReactGA.initialize("G-MH41GHSLC9");

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}