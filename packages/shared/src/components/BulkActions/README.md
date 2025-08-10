# Bulk Actions Framework

This framework provides a comprehensive system for performing bulk operations on hosts in the Foreman UI, with full plugin extensibility.

## Core Features

- **Multi-select functionality** with checkboxes in table headers and rows
- **Bulk action toolbar** that appears when items are selected
- **Confirmation modals** with customizable parameters
- **Progress tracking** and result reporting
- **Plugin extensibility** through the extension point system
- **Permission-based access control**
- **Responsive design** following PatternFly patterns

## Built-in Actions

### Delete Hosts
- **ID**: `delete`
- **Permission**: `destroy_hosts`
- **Type**: Destructive
- **API**: `POST /api/v2/hosts/bulk_action` with `operation: 'destroy'`

### Change Host Group
- **ID**: `change-hostgroup`
- **Permission**: `edit_hosts`
- **Type**: Update
- **Parameters**: Host group selection dropdown
- **API**: `POST /api/v2/hosts/bulk_action` with `operation: 'update'`

## Plugin Integration

### Basic Plugin Bulk Action

```typescript
import { createBulkActionExtension, pluginRegistry } from '@foreman/shared';

// Create a simple bulk action
const myBulkAction = createBulkActionExtension({
  id: 'my-plugin-action',
  label: 'My Plugin Action',
  permissions: ['my_permission'],
  requiresConfirmation: true,
  confirmationTitle: 'Execute Plugin Action',
  confirmationMessage: 'This will run my plugin action on selected hosts.',
  destructive: false,
});

// Register with plugin system
pluginRegistry.register({
  name: 'my-plugin',
  version: '1.0.0',
  displayName: 'My Plugin',
  componentExtensions: [myBulkAction],
});
```

### Advanced Plugin Bulk Action with Custom Component

```typescript
import React from 'react';
import { BulkActionExtensionProps, createBulkActionExtension } from '@foreman/shared';

// Custom component for complex bulk operations
const AnsiblePlaybookBulkAction: React.FC<BulkActionExtensionProps> = ({
  selectedItems,
  allItems,
  onComplete
}) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runPlaybook = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/ansible/playbooks/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playbook_id: selectedPlaybook,
          host_ids: selectedItems,
        }),
      });
      
      const result = await response.json();
      onComplete({
        success: result.successful_hosts?.length || 0,
        failed: result.failed_hosts?.length || 0,
        errors: result.errors || [],
      });
    } catch (error) {
      onComplete({
        success: 0,
        failed: selectedItems.length,
        errors: [{ host_id: 0, message: 'Failed to run playbook' }],
      });
    }
    setIsRunning(false);
  };

  return (
    <div>
      <Select
        value={selectedPlaybook}
        onChange={setSelectedPlaybook}
        placeholder="Select playbook..."
      >
        {/* Playbook options */}
      </Select>
      <Button onClick={runPlaybook} isLoading={isRunning}>
        Run Playbook
      </Button>
    </div>
  );
};

// Register the advanced action
const ansibleBulkAction = createBulkActionExtension({
  id: 'ansible-playbook',
  label: 'Run Ansible Playbook',
  permissions: ['execute_ansible'],
  component: AnsiblePlaybookBulkAction,
});
```

## Extension Point

Bulk actions use the `HOST_BULK_ACTIONS` extension point:

```typescript
export const EXTENSION_POINTS = {
  HOST_BULK_ACTIONS: 'host-bulk-actions',
  // ... other extension points
} as const;
```

## API Contract

### Bulk Operation Request
```typescript
interface BulkOperationRequest {
  operation: string;
  host_ids: number[];
  parameters?: Record<string, unknown>;
}
```

### Bulk Operation Response
```typescript
interface BulkOperationResult {
  success_count: number;
  failed_count: number;
  errors?: Array<{
    host_id: number;
    host_name?: string;
    message: string;
  }>;
  warnings?: string[];
}
```

## Permissions

Bulk actions respect Foreman's permission system:

- Actions are filtered based on user permissions
- Each action can specify required permissions
- Actions without proper permissions are hidden from the UI

## User Experience

1. **Selection**: Users select hosts using checkboxes
2. **Action Bar**: Bulk action toolbar appears with available actions
3. **Confirmation**: Modal dialog confirms the action with parameters
4. **Execution**: Progress indicator shows operation status
5. **Results**: Success/failure summary with detailed error messages
6. **Cleanup**: Selection is cleared after successful operations

## Performance Considerations

- **Lazy Loading**: Plugin actions are loaded only when needed
- **Efficient Selection**: Uses Set data structures for O(1) lookups
- **Memoization**: Expensive computations are cached
- **Pagination**: Bulk selection works across paginated results

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkActionToolbar } from './BulkActionToolbar';

test('shows bulk actions when items are selected', () => {
  const mockActions = [
    {
      id: 'test-action',
      label: 'Test Action',
      action: jest.fn(),
    },
  ];

  render(
    <BulkActionToolbar
      selectedCount={5}
      totalCount={10}
      actions={mockActions}
      onActionClick={jest.fn()}
      onClearSelection={jest.fn()}
    />
  );

  expect(screen.getByText('5 of 10 selected')).toBeInTheDocument();
  expect(screen.getByText('Test Action')).toBeInTheDocument();
});
```

## Best Practices

1. **Clear Labels**: Use descriptive action names
2. **Confirmation**: Always confirm destructive operations
3. **Progress Feedback**: Show progress for long-running operations
4. **Error Handling**: Provide clear error messages
5. **Permissions**: Respect user permissions and roles
6. **Responsive**: Ensure actions work on all screen sizes
7. **Accessibility**: Follow ARIA guidelines for screen readers