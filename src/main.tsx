import React, { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import "./styles/beta-polish.css";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class VybzErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    return;
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-screen">
          <section className="auth-card">
            <img src="/icons/icon.svg" alt="" />
            <p className="eyebrow">Loading issue</p>
            <h1>Vybz had trouble loading.</h1>
            <p className="muted-copy">Tap to retry.</p>
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VybzErrorBoundary>
      <App />
    </VybzErrorBoundary>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.update().catch(() => undefined))
      .catch(() => undefined);
  });
}
