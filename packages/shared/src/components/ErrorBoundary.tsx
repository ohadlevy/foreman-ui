import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
  Button,
  EmptyStateActions
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <EmptyState>
          <EmptyStateIcon icon={ExclamationTriangleIcon} />
          <Title headingLevel="h4" size="lg">
            Something went wrong
          </Title>
          <EmptyStateBody>
            {this.state.error?.message || 'An unexpected error occurred'}
          </EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={this.handleRetry}>
              Try again
            </Button>
            <Button variant="link" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </EmptyStateActions>
        </EmptyState>
      );
    }

    return this.props.children;
  }
}