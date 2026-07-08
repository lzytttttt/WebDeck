"use client";

import React from "react";

// ─── Global Error Boundary ───────────────────────────────────────────────────
// Catches uncaught errors anywhere in the tree and shows a fallback UI so the
// whole app doesn't white-screen.

interface GlobalState {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  GlobalState
> {
  state: GlobalState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): GlobalState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[GlobalErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          <pre className="max-w-lg overflow-auto rounded bg-red-50 p-4 text-xs text-red-800">
            {this.state.error?.message}
          </pre>
          <button
            className="rounded bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Section-level Error Boundary ────────────────────────────────────────────
// Wraps individual deck sections so that a crash in one section shows a red
// placeholder without taking down the rest of the deck.

interface SectionState {
  hasError: boolean;
}

export class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionId?: string },
  SectionState
> {
  state: SectionState = { hasError: false };

  static getDerivedStateFromError(): SectionState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SectionErrorBoundary]", this.props.sectionId, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-4 rounded-lg border-2 border-red-400 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">
            This section failed to render.
          </p>
          {this.props.sectionId && (
            <p className="mt-1 text-xs text-red-500">
              Section ID: {this.props.sectionId}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
