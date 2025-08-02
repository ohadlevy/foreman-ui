import React from 'react';
import { Brand, Title } from '@patternfly/react-core';
import { FOREMAN_BRANDING } from '../../constants/branding';

interface ForemanBrandProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ForemanBrand: React.FC<ForemanBrandProps> = ({
  size = 'md',
  showText = true,
  onClick,
  className = ''
}) => {
  const heights = {
    sm: '24px',
    md: '36px',
    lg: '48px'
  };

  const titleSizes = {
    sm: 'lg' as const,
    md: 'xl' as const,
    lg: '2xl' as const
  };

  const brandElement = (
    <div className={`pf-v5-u-display-flex pf-v5-u-align-items-center pf-v5-u-gap-sm ${className}`}>
      <Brand
        src={FOREMAN_BRANDING.logoPath}
        alt={FOREMAN_BRANDING.name}
        heights={{ default: heights[size] }}
        style={{ filter: 'none' }} // Remove any filtering
      />
      {showText && (
        <Title headingLevel="h1" size={titleSizes[size]} style={{ color: FOREMAN_BRANDING.colors.primary }}>
          {FOREMAN_BRANDING.name}
        </Title>
      )}
    </div>
  );

  if (onClick) {
    return (
      <div
        onClick={onClick}
        style={{ cursor: 'pointer' }}
        className="pf-v5-u-display-inline-block"
      >
        {brandElement}
      </div>
    );
  }

  return brandElement;
};