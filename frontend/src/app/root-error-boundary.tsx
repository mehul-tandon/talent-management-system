import { Component, type ErrorInfo, type ReactNode } from "react";

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
}

export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled frontend error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-grid">
          <section className="panel">
            <p className="eyebrow">Something broke</p>
            <h1>TalentOS hit an unexpected error.</h1>
            <p>Refresh the page and try again. If the problem persists, check the browser console and backend logs.</p>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}
