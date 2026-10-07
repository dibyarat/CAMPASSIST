window.addEventListener('error', function(e) {
  document.body.innerHTML = '<div style="color:red;padding:20px;font-size:20px;z-index:9999;position:fixed;top:0;left:0;background:white;width:100%;height:100%;"><p><strong>Error:</strong> ' + e.message + '</p><pre>' + (e.error?.stack || '') + '</pre></div>';
});
window.addEventListener('unhandledrejection', function(e) {
  document.body.innerHTML = '<div style="color:red;padding:20px;font-size:20px;z-index:9999;position:fixed;top:0;left:0;background:white;width:100%;height:100%;"><p><strong>Unhandled Promise Rejection:</strong> ' + e.reason + '</p></div>';
});

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  info: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#ffebee', color: '#c62828', fontFamily: 'monospace' }}>
          <h2>Frontend Crashed in React</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
