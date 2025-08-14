import React, { useState, useMemo } from 'react';

interface SkipToContentProps {
  href: string;
  children: React.ReactNode;
}

const skipToContentStyles: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  padding: '0.5rem 1rem',
  background: 'var(--pf-v6-global--BackgroundColor--100)',
  color: 'var(--pf-v6-global--Color--100)',
  borderRadius: 'var(--pf-v6-global--BorderRadius--sm)',
  border: '1px solid var(--pf-v6-global--BorderColor--100)',
  textDecoration: 'none',
  fontWeight: 'bold',
  zIndex: 9999,
  transition: 'left 0.3s ease',
};

const focusedStyles: React.CSSProperties = {
  left: '1rem',
  top: '1rem',
  width: 'auto',
  height: 'auto',
  overflow: 'visible',
};


/**
 * Accessible skip-to-content link that only shows when focused
 * Follows WCAG guidelines for keyboard navigation
 * @param href - The anchor link target to skip to
 * @param children - The content of the skip link
 */
export const SkipToContent: React.FC<SkipToContentProps> = ({ href, children }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const currentStyles = useMemo(() => {
    return isFocused 
      ? { ...skipToContentStyles, ...focusedStyles }
      : skipToContentStyles;
  }, [isFocused]);

  return (
    <a
      href={href}
      style={currentStyles}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </a>
  );
};