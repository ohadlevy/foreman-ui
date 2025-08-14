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
    <div 
      className={`pf-v6-u-display-flex pf-v6-u-align-items-center pf-v6-u-gap-sm ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        gap: 'var(--pf-v6-global--spacer--sm)'
      }}
    >
      <Brand
        src={FOREMAN_BRANDING.logoPath}
        alt={FOREMAN_BRANDING.name}
        heights={{ default: heights[size] }}
        style={{ flexShrink: 0, display: 'inline-block' }}
      />
      {showText && (
        <Title 
          headingLevel="h1" 
          size={titleSizes[size]} 
          className="pf-v6-c-title"
          style={{ 
            color: FOREMAN_BRANDING.colors.primary,
            margin: 0,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'inline-block'
          }}
        >
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
        className="pf-v6-u-display-inline-block"
      >
        {brandElement}
      </div>
    );
  }

  return brandElement;
};