import { Component, type ErrorInfo, type ReactNode } from 'react';

import { log } from '@/core/log';
import { ErrorBanner } from '@/dashboard/components/ErrorBanner';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** E-003 — Catches render errors and shows the shared error banner. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    log('dashboard render error', error, info);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorBanner onRetry={() => location.reload()} />;
    }
    return this.props.children;
  }
}
