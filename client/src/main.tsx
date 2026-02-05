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
    document.getElementById("root")!.innerHTML = `
      <div style="text-align: center; padding: 50px; font-family: system-ui;">
        <h2>Loading...</h2>
        <p>Please wait while we load the application.</p>
      </div>
    `;
  }
};

renderApp();
