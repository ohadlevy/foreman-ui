import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxonomySelector } from '../TaxonomySelector';
import { EnhancedOrganization } from '../../../types/taxonomy';

// Create a context for test mocking
const MockDropdownContext = React.createContext<{
  onSelect?: () => void;
  onOpenChange?: (open: boolean) => void;
}>({});

// Mock PatternFly components that use portals
vi.mock('@patternfly/react-core', async () => {
  const actual = await vi.importActual('@patternfly/react-core') as Record<string, any>;
  return {
    ...actual,
    Dropdown: ({ children, isOpen, onSelect, onOpenChange, toggle, ...props }: any) => {
      const [internalOpen, setInternalOpen] = React.useState(false);
      const isDropdownOpen = isOpen !== undefined ? isOpen : internalOpen;
      
      const contextValue = React.useMemo(() => ({
        onSelect,
        onOpenChange: (open: boolean) => {
          setInternalOpen(open);
          if (onOpenChange) onOpenChange(open);
        }
      }), [onSelect, onOpenChange]);

      return (
        <MockDropdownContext.Provider value={contextValue}>
          <div data-testid="dropdown" {...props}>
            {toggle && toggle({ current: null })}
            {isDropdownOpen && (
              <div data-testid="dropdown-menu">
                {children}
              </div>
            )}
          </div>
        </MockDropdownContext.Provider>
      );
    },
    DropdownList: ({ children }: any) => (
      <div data-testid="dropdown-list">{children}</div>
    ),
    DropdownItem: ({ children, onClick, isSelected, isDisabled, description, ...props }: any) => {
      const { onOpenChange } = React.useContext(MockDropdownContext);
      return (
        <div
          data-testid="dropdown-item"
          data-selected={isSelected}
          data-disabled={isDisabled}
          onClick={(e: React.MouseEvent) => {
            if (!isDisabled && onClick) {
              onClick(e);
            }
            // Close dropdown after selection
            if (!isDisabled && onOpenChange) {
              onOpenChange(false);
            }
          }}
          title={description}
          {...props}
        >
          {children}
        </div>
      );
    },
    MenuToggle: React.forwardRef(function MenuToggle({ children, onClick, isExpanded, isDisabled, icon, ...props }: any, ref) {
      const { onOpenChange } = React.useContext(MockDropdownContext);
      return (
      <button
        ref={ref}
        data-testid="menu-toggle"
        onClick={(e: React.MouseEvent) => {
          if (onClick) onClick(e);
          // Toggle dropdown state
          if (onOpenChange) {
            onOpenChange(!isExpanded);
          }
        }}
        disabled={isDisabled}
        aria-expanded={isExpanded}
        {...props}
      >
        {icon && <span data-testid="toggle-icon">{icon}</span>}
        {children}
      </button>
      );
    }),
    SearchInput: ({ placeholder, value, onChange, onClear, ...props }: any) => (
      <div data-testid="search-input">
        <input
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange && onChange(event, event.target.value)}
          {...props}
        />
        {value && onClear && (
          <button onClick={() => onClear()}>Clear</button>
        )}
      </div>
    ),
    Divider: () => <hr data-testid="divider" />,
    EmptyState: ({ children }: any) => <div data-testid="empty-state">{children}</div>,
    EmptyStateBody: ({ children }: any) => <div data-testid="empty-state-body">{children}</div>,
    Spinner: () => <div data-testid="spinner">Loading...</div>,
    Alert: ({ children, variant, title }: any) => (
      <div data-testid="alert" data-variant={variant}>
        {title && <div>{title}</div>}
        {children}
      </div>
    )
  };
});

const mockOrganizations: EnhancedOrganization[] = [
  {
    id: 1,
    name: 'org1',
    title: 'Organization 1',
    description: 'First organization',
    hosts_count: 10,
    users_count: 5
  },
  {
    id: 2,
    name: 'org2',
    title: 'Organization 2',
    description: 'Second organization',
    hosts_count: 15,
    users_count: 8,
    parent_id: 1
  },
  {
    id: 3,
    name: 'org3',
    title: 'Organization 3',
    description: 'Third organization',
    hosts_count: 0,
    users_count: 2
  }
];

describe('TaxonomySelector', () => {
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
      render(<TaxonomySelector {...defaultProps} />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getByText('Select organization...')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <TaxonomySelector 
          {...defaultProps} 
          placeholder="Choose an organization" 
        />
      );
      
      expect(screen.getByText('Choose an organization')).toBeInTheDocument();
    });

    it('should display selected entity', () => {
      render(
        <TaxonomySelector 
          {...defaultProps} 
          selectedId={1}
        />
      );
      
      expect(screen.getByText('Organization 1')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(
        <TaxonomySelector 
          {...defaultProps} 
          isLoading={true}
        />
      );
      
      expect(screen.getByText('Loading organizations...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(
        <TaxonomySelector 
          {...defaultProps} 
          error="Failed to load organizations"
        />
      );
      
      expect(screen.getByText('Error loading organizations')).toBeInTheDocument();
      expect(screen.getByText('Failed to load organizations')).toBeInTheDocument();
    });

    it('should render disabled state', () => {
      render(
        <TaxonomySelector 
          {...defaultProps} 
          isDisabled={true}
        />
      );
      
      // In disabled state, the component should still render normally but with disabled toggle
      // We need to check the component structure since isDisabled doesn't change the main layout
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      const toggle = screen.getByTestId('menu-toggle');
      expect(toggle).toHaveAttribute('disabled');
    });
  });

  describe('interaction', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<TaxonomySelector {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    it('should display entities when opened', async () => {
      const user = userEvent.setup();
      render(<TaxonomySelector {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(screen.getByText('Organization 1')).toBeInTheDocument();
      expect(screen.getByText('Organization 2')).toBeInTheDocument();
      expect(screen.getByText('Organization 3')).toBeInTheDocument();
    });

    it('should call onSelectionChange when entity is selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <TaxonomySelector 
          {...defaultProps} 
          onSelectionChange={onSelectionChange}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      const option = screen.getByText('Organization 1');
      await user.click(option);
      
      expect(onSelectionChange).toHaveBeenCalledWith(1);
    });

    it('should show clear option when allowClear is true and entity is selected', async () => {
      const user = userEvent.setup();
      render(
        <TaxonomySelector 
          {...defaultProps} 
          selectedId={1}
          allowClear={true}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(screen.getByText('Clear selection')).toBeInTheDocument();
    });

    it('should call onSelectionChange with undefined when clear is selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <TaxonomySelector 
          {...defaultProps} 
          selectedId={1}
          allowClear={true}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      const clearOption = screen.getByText('Clear selection');
      await user.click(clearOption);
      
      expect(onSelectionChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('filtering', () => {
    it('should filter entities based on search input', async () => {
      const user = userEvent.setup();
      render(<TaxonomySelector {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      const searchInput = screen.getByTestId('search-input');
      const filterInput = searchInput.querySelector('input');
      await user.type(filterInput!, 'Organization 1');
      
      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument();
        expect(screen.queryByText('Organization 2')).not.toBeInTheDocument();
      });
    });

    it('should use custom filter function when provided', async () => {
      const user = userEvent.setup();
      const customFilter = vi.fn((filterValue: string, entities: any[]) => 
        entities.filter((e: any) => e.id === 1)
      );
      
      render(
        <TaxonomySelector 
          {...defaultProps} 
          onFilter={customFilter}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      const searchInput = screen.getByTestId('search-input');
      const filterInput = searchInput.querySelector('input');
      await user.type(filterInput!, 'test');
      
      expect(customFilter).toHaveBeenCalledWith('test', mockOrganizations);
    });
  });

  describe('hierarchy display', () => {
    it('should show indentation for child entities when showHierarchy is true', async () => {
      const user = userEvent.setup();
      render(
        <TaxonomySelector 
          {...defaultProps} 
          showHierarchy={true}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      // Check that child organization (org2) has indentation
      const childOption = screen.getByText('Organization 2').closest('[data-testid="dropdown-item"]');
      const childDiv = childOption?.querySelector('div');
      expect(childDiv).toHaveStyle({ marginLeft: '20px' });
    });

    it('should not show indentation when showHierarchy is false', async () => {
      const user = userEvent.setup();
      render(
        <TaxonomySelector 
          {...defaultProps} 
          showHierarchy={false}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      // Check that all organizations have no indentation
      const childOption = screen.getByText('Organization 2').closest('[data-testid="dropdown-item"]');
      const childDiv = childOption?.querySelector('div');
      expect(childDiv).toHaveStyle({ marginLeft: '0px' });
    });
  });

  describe('counts display', () => {
    it('should show entity counts when showCounts is true', async () => {
      const user = userEvent.setup();
      render(
        <TaxonomySelector 
          {...defaultProps} 
          showCounts={true}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(screen.getByText('(10 hosts, 5 users)')).toBeInTheDocument();
      expect(screen.getByText('(15 hosts, 8 users)')).toBeInTheDocument();
    });

    it('should not show entity counts when showCounts is false', async () => {
      const user = userEvent.setup();
      render(
        <TaxonomySelector 
          {...defaultProps} 
          showCounts={false}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(screen.queryByText('(10 hosts, 5 users)')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      render(<TaxonomySelector {...defaultProps} />);
      
      const toggle = screen.getByTestId('menu-toggle');
      expect(toggle).toHaveAttribute('aria-label', 'Select organization');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TaxonomySelector {...defaultProps} />);
      
      const toggle = screen.getByRole('button');
      
      // Focus and open with Enter
      toggle.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty entities array', () => {
      render(
        <TaxonomySelector 
          {...defaultProps} 
          entities={[]}
        />
      );
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('should handle entities without titles', async () => {
      const entitiesWithoutTitles = [
        { id: 1, name: 'org1', description: 'Organization 1' }
      ] as EnhancedOrganization[];
      
      const user = userEvent.setup();
      render(
        <TaxonomySelector 
          {...defaultProps} 
          entities={entitiesWithoutTitles}
        />
      );
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(screen.getByText('org1')).toBeInTheDocument();
    });

    it('should handle selected entity that doesn\'t exist in entities', () => {
      render(
        <TaxonomySelector 
          {...defaultProps} 
          selectedId={999}
        />
      );
      
      expect(screen.getByText('Select organization...')).toBeInTheDocument();
    });
  });
});