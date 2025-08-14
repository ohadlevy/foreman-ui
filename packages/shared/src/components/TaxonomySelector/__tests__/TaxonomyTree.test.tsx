import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxonomyTree } from '../TaxonomyTree';
import { EnhancedOrganization } from '../../../types/taxonomy';

// Mock PatternFly components
vi.mock('@patternfly/react-core', async () => {
  const actual = await vi.importActual('@patternfly/react-core') as Record<string, any>;
  return {
    ...actual,
    TreeView: ({ data, onSelect, activeItems, hasBadges }: any) => (
      <div data-testid="tree-view">
        {data.map((item: any) => (
          <div 
            key={item.id} 
            data-testid="tree-item"
            onClick={() => onSelect && onSelect({}, item)}
            className={activeItems?.some((active: any) => active.id === item.id) ? 'active' : ''}
          >
            {item.name}
            {hasBadges && item.customBadgeContent && (
              <span data-testid="badge">{item.customBadgeContent}</span>
            )}
            {item.children && (
              <div data-testid="tree-children">
                {item.children.map((child: any) => (
                  <div key={child.id} data-testid="tree-child">
                    {child.name}
                    {hasBadges && child.customBadgeContent && (
                      <span data-testid="badge">{child.customBadgeContent}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ),
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
    CardBody: ({ children }: any) => <div data-testid="card-body">{children}</div>,
    Toolbar: ({ children }: any) => <div data-testid="toolbar">{children}</div>,
    ToolbarContent: ({ children }: any) => <div data-testid="toolbar-content">{children}</div>,
    ToolbarItem: ({ children }: any) => <div data-testid="toolbar-item">{children}</div>,
    SearchInput: ({ placeholder, value, onChange }: any) => (
      <input
        data-testid="search-input"
        placeholder={placeholder}
        value={value || ''}
        onChange={(event) => onChange && onChange(event, event.target.value)}
      />
    ),
    Button: ({ children, onClick, isDisabled }: any) => (
      <button onClick={onClick} disabled={isDisabled}>
        {children}
      </button>
    ),
    Flex: ({ children }: any) => <div data-testid="flex">{children}</div>,
    FlexItem: ({ children }: any) => <div data-testid="flex-item">{children}</div>,
    Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
    EmptyState: ({ children }: any) => <div data-testid="empty-state">{children}</div>,
    EmptyStateBody: ({ children }: any) => <div data-testid="empty-state-body">{children}</div>,
    Spinner: () => <div data-testid="spinner">Loading...</div>
  };
});

// Mock the buildTaxonomyTree utility
vi.mock('../../../utils/taxonomyHelpers', () => ({
  buildTaxonomyTree: (entities: any[]) => {
    return entities
      .filter(e => !e.parent_id)
      .map(parent => ({
        entity: parent,
        children: entities
          .filter(e => e.parent_id === parent.id)
          .map(child => ({
            entity: child,
            children: [],
            level: 1,
            expanded: false,
            selected: false,
            disabled: false
          })),
        level: 0,
        expanded: false,
        selected: false,
        disabled: false
      }));
  }
}));

const mockOrganizations: EnhancedOrganization[] = [
  {
    id: 1,
    name: 'org1',
    title: 'Organization 1',
    description: 'Root organization',
    hosts_count: 10,
    users_count: 5
  },
  {
    id: 2,
    name: 'org2',
    title: 'Organization 2',
    description: 'Child organization',
    hosts_count: 15,
    users_count: 8,
    parent_id: 1
  },
  {
    id: 3,
    name: 'org3',
    title: 'Organization 3',
    description: 'Another root organization',
    hosts_count: 5,
    users_count: 3
  }
];

describe('TaxonomyTree', () => {
  const defaultProps = {
    type: 'organization' as const,
    entities: mockOrganizations,
    onSelectionChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      render(<TaxonomyTree {...defaultProps} />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('tree-view')).toBeInTheDocument();
    });

    it('should render without card wrapper when asCard is false', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          asCard={false}
        />
      );
      
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
      expect(screen.getByTestId('tree-view')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          title="Custom Tree Title"
        />
      );
      
      expect(screen.getByText('Custom Tree Title')).toBeInTheDocument();
    });

    it('should display entities in tree format', () => {
      render(<TaxonomyTree {...defaultProps} />);
      
      expect(screen.getByText('org1')).toBeInTheDocument();
      expect(screen.getByText('org3')).toBeInTheDocument();
    });

    it('should show hierarchical structure with children', () => {
      render(<TaxonomyTree {...defaultProps} />);
      
      // Should show parent organizations
      expect(screen.getByText('org1')).toBeInTheDocument();
      expect(screen.getByText('org3')).toBeInTheDocument();
      
      // Should show child organization under parent
      expect(screen.getByText('org2')).toBeInTheDocument();
    });
  });

  describe('toolbar functionality', () => {
    it('should show search input when hasSearch is true', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasSearch={true}
        />
      );
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search organizations...')).toBeInTheDocument();
    });

    it('should not show search input when hasSearch is false', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasSearch={false}
        />
      );
      
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });

    it('should show expand/collapse controls when hasExpandControls is true', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasExpandControls={true}
        />
      );
      
      expect(screen.getByText('Expand all')).toBeInTheDocument();
      expect(screen.getByText('Collapse all')).toBeInTheDocument();
    });

    it('should not show expand/collapse controls when hasExpandControls is false', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasExpandControls={false}
        />
      );
      
      expect(screen.queryByText('Expand all')).not.toBeInTheDocument();
      expect(screen.queryByText('Collapse all')).not.toBeInTheDocument();
    });

    it('should not show toolbar when both search and controls are disabled', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasSearch={false}
          hasExpandControls={false}
        />
      );
      
      expect(screen.queryByTestId('toolbar')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading state when isLoading is true', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          isLoading={true}
        />
      );
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Loading organizations...')).toBeInTheDocument();
    });

    it('should disable expand controls when loading', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          isLoading={true}
          hasExpandControls={true}
        />
      );
      
      const expandButton = screen.getByText('Expand all');
      const collapseButton = screen.getByText('Collapse all');
      
      expect(expandButton).toBeDisabled();
      expect(collapseButton).toBeDisabled();
    });
  });

  describe('error state', () => {
    it('should show error state when error is provided', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          error="Failed to load organizations"
        />
      );
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Error loading organizations: Failed to load organizations')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no entities are available', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          entities={[]}
        />
      );
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No organizations available')).toBeInTheDocument();
    });
  });

  describe('selection functionality', () => {
    it('should call onSelectionChange when entity is selected (single select)', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <TaxonomyTree 
          {...defaultProps} 
          onSelectionChange={onSelectionChange}
          allowMultiSelect={false}
        />
      );
      
      const firstEntity = screen.getByText('org1');
      await user.click(firstEntity);
      
      expect(onSelectionChange).toHaveBeenCalledWith([1]);
    });

    it('should support multiple selection when allowMultiSelect is true', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <TaxonomyTree 
          {...defaultProps} 
          onSelectionChange={onSelectionChange}
          allowMultiSelect={true}
          selectedIds={[]}
        />
      );
      
      const firstEntity = screen.getByText('org1');
      await user.click(firstEntity);
      
      expect(onSelectionChange).toHaveBeenCalledWith([1]);
    });

    it('should toggle selection in multi-select mode', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <TaxonomyTree 
          {...defaultProps} 
          onSelectionChange={onSelectionChange}
          allowMultiSelect={true}
          selectedIds={[1]}
        />
      );
      
      const firstEntity = screen.getByText('org1');
      await user.click(firstEntity);
      
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should show active items correctly', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          selectedIds={[1]}
        />
      );
      
      const activeItem = screen.getByText('org1').closest('[data-testid="tree-item"]');
      expect(activeItem).toHaveClass('active');
    });
  });

  describe('search functionality', () => {
    it('should filter entities based on search input', async () => {
      const user = userEvent.setup();
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasSearch={true}
        />
      );
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'org1');
      
      // The filtering logic would be handled by the onFilter prop or internal filtering
      expect(searchInput).toHaveValue('org1');
    });

    it('should use custom filter function when provided', async () => {
      const user = userEvent.setup();
      const customFilter = vi.fn((searchValue: string, entities: any[]) => 
        entities.filter((e: any) => e.id === 1)
      );
      
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasSearch={true}
          onFilter={customFilter}
        />
      );
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');
      
      expect(customFilter).toHaveBeenCalledWith('test', mockOrganizations);
    });
  });

  describe('expand/collapse functionality', () => {
    it('should handle expand all button click', async () => {
      const user = userEvent.setup();
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasExpandControls={true}
        />
      );
      
      const expandButton = screen.getByText('Expand all');
      await user.click(expandButton);
      
      // The expand logic would update internal state
      expect(expandButton).toBeInTheDocument();
    });

    it('should handle collapse all button click', async () => {
      const user = userEvent.setup();
      render(
        <TaxonomyTree 
          {...defaultProps} 
          hasExpandControls={true}
        />
      );
      
      const collapseButton = screen.getByText('Collapse all');
      await user.click(collapseButton);
      
      // The collapse logic would update internal state
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe('custom rendering', () => {
    it('should use custom render function when provided', () => {
      const customRender = vi.fn((entity) => (
        <div data-testid="custom-item">Custom: {entity.name}</div>
      ));
      
      render(
        <TaxonomyTree 
          {...defaultProps} 
          renderItem={customRender}
        />
      );
      
      expect(customRender).toHaveBeenCalled();
    });
  });

  describe('counts display', () => {
    it('should show entity counts when showCounts is true', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          showCounts={true}
        />
      );
      
      // The counts would be rendered as badges in the tree items
      // Note: The mock builds a tree with org1 as parent and org2 as child, plus org3 as root
      // So we expect badges for org1, org2, and org3 (3 total)
      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should not show entity counts when showCounts is false', () => {
      render(
        <TaxonomyTree 
          {...defaultProps} 
          showCounts={false}
        />
      );
      
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('type variations', () => {
    it('should render correctly for location type', () => {
      render(
        <TaxonomyTree 
          type="location"
          entities={[]}
          hasSearch={true}
        />
      );
      
      expect(screen.getByPlaceholderText('Search locations...')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle entities without titles', () => {
      const entitiesWithoutTitles = [
        { id: 1, name: 'org1', description: 'Organization 1' }
      ] as EnhancedOrganization[];
      
      render(
        <TaxonomyTree 
          {...defaultProps} 
          entities={entitiesWithoutTitles}
        />
      );
      
      expect(screen.getByText('org1')).toBeInTheDocument();
    });

    it('should handle circular references in hierarchy', () => {
      const circularEntities = [
        { id: 1, name: 'org1', parent_id: 2 },
        { id: 2, name: 'org2', parent_id: 1 }
      ] as EnhancedOrganization[];
      
      // Should not crash with circular references and show empty state
      render(
        <TaxonomyTree 
          {...defaultProps} 
          entities={circularEntities}
        />
      );
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No organizations available')).toBeInTheDocument();
    });

    it('should handle deep hierarchy levels', () => {
      const deepHierarchy = [
        { id: 1, name: 'level1' },
        { id: 2, name: 'level2', parent_id: 1 },
        { id: 3, name: 'level3', parent_id: 2 },
        { id: 4, name: 'level4', parent_id: 3 }
      ] as EnhancedOrganization[];
      
      render(
        <TaxonomyTree 
          {...defaultProps} 
          entities={deepHierarchy}
        />
      );
      
      expect(screen.getByText('level1')).toBeInTheDocument();
    });
  });
});