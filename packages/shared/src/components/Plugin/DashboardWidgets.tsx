import React from 'react';
import { Grid, GridItem, Card, CardTitle, CardBody } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { usePluginDashboardWidgets } from '../../plugins/hooks';
import { useAuthStore } from '../../auth/store';
import { hasPluginPermissions } from '../../plugins/utils';

interface DashboardWidgetsProps {
  /** Number of columns in the grid (default: 3) */
  columns?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component that renders plugin-provided dashboard widgets in a responsive grid
 */
export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ 
  columns = 3, 
  className 
}) => {
  const { t } = useTranslation();
  const widgets = usePluginDashboardWidgets();
  const { user } = useAuthStore();
  
  // Get user permissions for filtering
  const userPermissions = user?.roles?.flatMap(role => role.permissions || []) || [];
  
  // Filter widgets by permissions
  const filteredWidgets = widgets.filter(widget => 
    hasPluginPermissions(widget.permissions, userPermissions)
  );
  
  if (filteredWidgets.length === 0) {
    return null;
  }
  
  // Calculate grid span based on widget size
  const getGridSpan = (size: string | undefined): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 => {
    switch (size) {
      case 'small':
        return Math.floor(12 / columns) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
      case 'medium':
        return Math.floor(12 / Math.max(1, columns - 1)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
      case 'large':
        return 12;
      default:
        return Math.floor(12 / columns) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    }
  };
  
  return (
    <Grid hasGutter className={className}>
      {filteredWidgets.map((widget) => {
        const WidgetComponent = widget.component;
        const title = widget.titleKey ? t(widget.titleKey) : widget.title;
        const span = getGridSpan(widget.size);
        
        return (
          <GridItem key={widget.id} span={span}>
            <Card isFullHeight>
              {title && (
                <CardTitle>{title}</CardTitle>
              )}
              <CardBody>
                <WidgetComponent 
                  widgetId={widget.id}
                  title={title}
                  size={widget.size}
                />
              </CardBody>
            </Card>
          </GridItem>
        );
      })}
    </Grid>
  );
};

export default DashboardWidgets;