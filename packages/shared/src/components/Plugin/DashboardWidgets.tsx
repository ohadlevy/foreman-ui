import React from 'react';
import { Grid, GridItem, Card, CardTitle, CardBody } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { usePluginDashboardWidgets } from '../../plugins/hooks';
import { useAuthStore } from '../../auth/store';
import { hasPluginPermissions } from '../../plugins/utils';
import { calculateWidgetGridSpan, type GridSpan } from '../../utils/gridUtils';

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

  // Calculate grid span based on widget size using utility function
  const getGridSpan = (size: string | undefined): GridSpan => {
    return calculateWidgetGridSpan(size, columns);
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