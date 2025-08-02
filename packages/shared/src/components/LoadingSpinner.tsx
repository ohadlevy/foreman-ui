import React from 'react';
import { Spinner } from '@patternfly/react-core';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  className 
}) => {
  return (
    <div className={`pf-v5-u-display-flex pf-v5-u-justify-content-center pf-v5-u-align-items-center ${className || ''}`}>
      <Spinner size={size} />
    </div>
  );
};