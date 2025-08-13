import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  AlertGroup,
  Alert,
  Title,
} from '@patternfly/react-core';
import {
  GripVerticalIcon,
  EditIcon,
  SaveIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import { usePluginDashboardWidgets, useAuthStore, hasPluginPermissions, DashboardWidget } from '@foreman/shared';
import { useUserSettingsStore, DashboardWidgetLayout } from '../stores/userSettingsStore';

const WIDGET_TYPE = 'WIDGET';
const TOAST_TIMEOUT_MS = 3000;

// Union type for plugin widgets and demo widgets
type Widget = DashboardWidget | {
  id: string;
  title: string;
  component: React.ComponentType;
  permissions: string[];
};

// Type guard function to check if widget is a DashboardWidget
const isDashboardWidget = (widget: Widget): widget is DashboardWidget => {
  return 'titleKey' in widget;
};

interface DraggableWidgetProps {
  widget: Widget;
  index: number;
  moveWidget: (dragIndex: number, hoverIndex: number) => void;
  isEditMode: boolean;
}


const DraggableWidget = React.forwardRef<HTMLDivElement, DraggableWidgetProps>(({
  widget,
  index,
  moveWidget,
  isEditMode,
}, _forwardedRef) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: WIDGET_TYPE,
    item: { index },
    canDrag: isEditMode,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: WIDGET_TYPE,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveWidget(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const WidgetComponent = widget.component;
  const title = isDashboardWidget(widget) && widget.titleKey ? widget.titleKey : widget.title;

  const opacity = isDragging ? 0.5 : 1;
  const backgroundColor = isOver ? 'var(--pf-v5-global--BackgroundColor--200)' : undefined;

  return (
    <GridItem span={4}>
      <div
        ref={(node) => preview(drop(node))}
        style={{ opacity, backgroundColor, transition: 'background-color var(--pf-v5-global--TransitionDuration)' }}
      >
      <Card 
        isFullHeight
        style={isEditMode ? {
          border: '2px dashed var(--pf-v5-global--primary-color--100)',
          backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)'
        } : {}}
      >
        {(title || isEditMode) && (
          <CardTitle>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{title}</span>
              {isEditMode && (
                <Button
                  ref={drag}
                  variant="plain"
                  aria-label="Drag to reorder"
                  style={{ 
                    cursor: 'grab',
                    marginLeft: '0.5rem',
                    padding: '0.25rem',
                    border: '1px solid var(--pf-v5-global--BorderColor--100)',
                    borderRadius: 'var(--pf-v5-global--BorderRadius--sm)',
                    backgroundColor: 'var(--pf-v5-global--BackgroundColor--100)'
                  }}
                >
                  <GripVerticalIcon />
                </Button>
              )}
            </div>
          </CardTitle>
        )}
        <CardBody>
          <WidgetComponent />
        </CardBody>
      </Card>
      </div>
    </GridItem>
  );
});

DraggableWidget.displayName = 'DraggableWidget';

// Demo widgets for when no plugins are available
const demoWidgets = [
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    component: () => (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <p>Latest system activities would appear here</p>
        <small style={{ color: 'var(--pf-v5-global--Color--200)' }}>
          Demo widget - drag to reorder
        </small>
      </div>
    ),
    permissions: [],
  },
  {
    id: 'system-health',
    title: 'System Health',
    component: () => (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', color: 'var(--pf-v5-global--success-color--100)' }}>✓</div>
        <p>All systems operational</p>
        <small style={{ color: 'var(--pf-v5-global--Color--200)' }}>
          Demo widget - drag to reorder
        </small>
      </div>
    ),
    permissions: [],
  },
  {
    id: 'quick-stats',
    title: 'Quick Statistics',
    component: () => (
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>24</div>
            <small>Active</small>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>3</div>
            <small>Pending</small>
          </div>
        </div>
        <small style={{ color: 'var(--pf-v5-global--Color--200)', display: 'block', textAlign: 'center', marginTop: '0.5rem' }}>
          Demo widget - drag to reorder
        </small>
      </div>
    ),
    permissions: [],
  },
];

export const DraggableDashboard: React.FC = () => {
  const pluginWidgets = usePluginDashboardWidgets();
  const { user } = useAuthStore();
  const { getCurrentUserSettings, updateDashboardLayout } = useUserSettingsStore();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  
  // Store timeout ID for proper cleanup
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Memoize user permissions to prevent recalculation on every render
  const userPermissions = React.useMemo(() => 
    user?.roles?.flatMap(role => role.permissions || []) || [],
    [user?.roles]
  );

  // Use plugin widgets if available, otherwise use demo widgets
  const widgets = pluginWidgets.length > 0 ? pluginWidgets : demoWidgets;

  // Filter widgets by permissions - memoize to prevent unnecessary re-renders
  const filteredWidgets = React.useMemo(() => 
    widgets.filter(widget => {
      const widgetPermissions = widget.permissions || [];
      return hasPluginPermissions(widgetPermissions, userPermissions);
    }), [widgets, userPermissions]
  );

  // Get user settings and create initial widgets - memoize to prevent re-computation
  const userSettings = getCurrentUserSettings();
  const { initialWidgets } = React.useMemo(() => {
    const savedLayout = userSettings.dashboardLayout || [];
    
    if (savedLayout.length === 0) {
      return { initialWidgets: filteredWidgets };
    }
    
    // Sort widgets based on saved order
    const sortedWidgets = [...filteredWidgets];
    sortedWidgets.sort((a, b) => {
      const aIndex = savedLayout.findIndex(item => item.id === a.id);
      const bIndex = savedLayout.findIndex(item => item.id === b.id);
      
      // Put widgets with saved positions first
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
    
    return { initialWidgets: sortedWidgets };
  }, [filteredWidgets, userSettings.dashboardLayout]);
  
  // Create ordered widgets based on saved layout
  const [orderedWidgets, setOrderedWidgets] = useState(initialWidgets);

  // Keep track of original order for cancel functionality
  const [originalOrder, setOriginalOrder] = useState(initialWidgets);

  // Synchronize orderedWidgets and originalOrder with initialWidgets when not in edit mode
  React.useEffect(() => {
    if (!isEditMode) {
      setOrderedWidgets(initialWidgets);
      setOriginalOrder(initialWidgets);
    }
  }, [initialWidgets, isEditMode]);

  const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
    setOrderedWidgets(prevWidgets => {
      const newWidgets = [...prevWidgets];
      const draggedWidget = newWidgets[dragIndex];
      newWidgets.splice(dragIndex, 1);
      newWidgets.splice(hoverIndex, 0, draggedWidget);
      return newWidgets;
    });
  }, []);

  const handleEditMode = () => {
    if (!isEditMode) {
      // Entering edit mode - save current order as original
      setOriginalOrder([...orderedWidgets]);
    } else {
      // Exiting edit mode without saving - restore original order
      setOrderedWidgets([...originalOrder]);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveLayout = () => {
    // Create layout from current order
    const newLayout: DashboardWidgetLayout[] = orderedWidgets.map((widget, index) => ({
      id: widget.id,
      x: index % 3, // 3 columns grid
      y: Math.floor(index / 3),
      w: 1,
      h: 1,
    }));
    
    updateDashboardLayout(newLayout);
    setIsEditMode(false);
    setShowSaveAlert(true);
    
    // Clear existing timeout and set new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setShowSaveAlert(false), TOAST_TIMEOUT_MS);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Note: With demo widgets as fallback, we should always have content

  return (
    <div>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem' }}>
        Dashboard Widgets {pluginWidgets.length === 0 && '(Demo)'}
      </Title>
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup align={{ default: 'alignRight' }}>
            <ToolbarItem>
              {!isEditMode ? (
                <Button
                  variant="secondary"
                  icon={<EditIcon />}
                  onClick={handleEditMode}
                >
                  Customize Dashboard
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="primary"
                    icon={<SaveIcon />}
                    onClick={handleSaveLayout}
                  >
                    Save Layout
                  </Button>
                  <Button
                    variant="link"
                    icon={<TimesIcon />}
                    onClick={handleEditMode}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>

      {showSaveAlert && (
        <AlertGroup isToast>
          <Alert
            variant="success"
            title="Dashboard layout saved"
            timeout={TOAST_TIMEOUT_MS}
            onTimeout={() => setShowSaveAlert(false)}
          />
        </AlertGroup>
      )}

      {isEditMode && (
        <Alert
          variant="info"
          title="Dashboard Customization Mode"
          style={{ marginBottom: '1rem' }}
        >
          Drag the grip handles to reorder your dashboard widgets. Click &quot;Save Layout&quot; to keep your changes.
        </Alert>
      )}

      <DndProvider backend={HTML5Backend}>
        <Grid hasGutter>
          {orderedWidgets.map((widget, index) => (
            <DraggableWidget
              key={widget.id}
              widget={widget}
              index={index}
              moveWidget={moveWidget}
              isEditMode={isEditMode}
            />
          ))}
        </Grid>
      </DndProvider>
    </div>
  );
};