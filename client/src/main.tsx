import { createRoot } from "react-dom/client";

// Dynamic import for performance optimization
const loadApp = async () => {
  const [
    { default: App },
    // Load CSS asynchronously to prevent render blocking
  ] = await Promise.all([
    import("./App"),
    import("./index.css")
  ]);
  
  return App;
};

// Performance optimization: Load app with error boundary
const renderApp = async () => {
  try {
    const App = await loadApp();
    const root = createRoot(document.getElementById("root")!);
    root.render(<App />);
  } catch (error) {
    console.error('Failed to load application:', error);
    // Fallback UI
    const root = document.getElementById("root")!;
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "text-align: center; padding: 50px; font-family: system-ui;";
    const heading = document.createElement("h2");
    heading.textContent = "Loading...";
    const para = document.createElement("p");
    para.textContent = "Please wait while we load the application.";
    wrapper.appendChild(heading);
    wrapper.appendChild(para);
    root.appendChild(wrapper);
  }
};

renderApp();
