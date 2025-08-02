/**
 * Translation keys for the example plugin
 * 
 * These keys will be extracted to .po files for Foreman's translation workflow.
 * The values serve as default English text and development fallbacks.
 * 
 * Build process will generate:
 * - messages.pot template file
 * - Plugin-specific .po files for Transifex
 */
export const translationKeys = {
  // Menu items
  'menu.main': 'Example Plugin',

  // Page titles and content
  'pages.dashboard.title': 'Example Dashboard',
  'pages.dashboard.welcome': 'Welcome to the Example Plugin!',
  'pages.dashboard.description': 'This is a reference implementation showing how to create Foreman UI plugins.',
  
  // Features section
  'features.title': 'Plugin Features Demonstrated',
  'features.routes': 'Custom routes and pages',
  'features.menu': 'Navigation menu integration',
  'features.extensions': 'Component extensions (host tabs)',
  'features.widgets': 'Dashboard widgets',
  'features.i18n': 'Internationalization support',
  'features.permissions': 'Permission-based access control',

  // Host tab extension
  'host.tab_title': 'Example Data',
  'host.no_data': 'No example data available for this host.',
  'host.loading': 'Loading example data...',
  'host.info': 'This tab demonstrates how plugins can extend existing pages.',

  // Dashboard widgets
  'widgets.category': 'Example',
  'widgets.summary.title': 'Example Summary',
  'widgets.summary.total_items': 'Total Items',
  'widgets.summary.active_items': 'Active Items',
  'widgets.summary.last_updated': 'Last Updated',

  // Permissions
  'permissions.view_dashboard': 'View example plugin dashboard',
  'permissions.manage_features': 'Manage example plugin features',

  // Breadcrumbs
  'breadcrumbs.dashboard': 'Example Dashboard',

  // Actions
  'actions.refresh': 'Refresh',
  'actions.configure': 'Configure',
  'actions.export': 'Export Data',

  // Status messages
  'status.loading': 'Loading...',
  'status.error': 'An error occurred',
  'status.success': 'Operation completed successfully',
  'status.no_permission': 'You do not have permission to access this feature',

  // Form labels
  'form.name': 'Name',
  'form.description': 'Description',
  'form.enabled': 'Enabled',
  'form.save': 'Save',
  'form.cancel': 'Cancel',
  'form.required': 'This field is required',

  // Table headers
  'table.name': 'Name',
  'table.status': 'Status',
  'table.created': 'Created',
  'table.actions': 'Actions',

  // Common terms
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.enabled': 'Enabled',
  'common.disabled': 'Disabled',
  'common.active': 'Active',
  'common.inactive': 'Inactive'
};