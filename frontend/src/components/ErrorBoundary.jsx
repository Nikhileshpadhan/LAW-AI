import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    localStorage.removeItem("law_ai_token");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#07080a] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6 shadow-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif tracking-tight mb-2 text-white">Application Notice</h1>
          <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            The Supreme Court Intelligence portal encountered a temporary render exception:
          </p>
          <pre className="text-xs text-red-300/80 bg-zinc-950/80 border border-white/10 rounded-lg p-3 max-w-xl overflow-x-auto text-left mb-6">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Reload Intelligence Chamber
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
