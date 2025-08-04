/**
 * Grid utilities for PatternFly layout management
 */

export type GridSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Clamp a number to valid grid span range (1-12)
 */
export const clampToGridSpan = (value: number): GridSpan => {
  return Math.max(1, Math.min(12, Math.floor(value))) as GridSpan;
};

/**
 * Calculate grid span based on widget size and column configuration
 */
export const calculateWidgetGridSpan = (
  size: string | undefined,
  columns: number = 3
): GridSpan => {
  switch (size) {
    case 'small':
      // Small widgets take 1/columns of the row
      return clampToGridSpan(12 / columns);
    case 'medium':
      // Medium widgets take slightly more space (columns - 1 reduces competition)
      return clampToGridSpan(12 / Math.max(1, columns - 1));
    case 'large':
      // Large widgets take full width
      return 12;
    default:
      // Default to small behavior
      return clampToGridSpan(12 / columns);
  }
};

/**
 * Calculate responsive grid spans for different screen sizes
 */
export const calculateResponsiveSpans = (
  size: string | undefined,
  config: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  } = {}
): { sm?: GridSpan; md?: GridSpan; lg?: GridSpan } => {
  const { mobile = 1, tablet = 2, desktop = 3 } = config;

  return {
    sm: calculateWidgetGridSpan(size, mobile),
    md: calculateWidgetGridSpan(size, tablet),
    lg: calculateWidgetGridSpan(size, desktop),
  };
};