import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Split,
  SplitItem,
  Badge,
} from '@patternfly/react-core';
import {
  TimesIcon,
  EllipsisVIcon,
} from '@patternfly/react-icons';
import { BulkAction } from '../../types';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  onActionClick: (action: BulkAction) => void;
  onSelectAllPages?: () => void;
  showSelectAllPages?: boolean;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
  onActionClick,
  onSelectAllPages,
  showSelectAllPages = false,
}) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);


  const enabledActions = actions.filter(action => !action.disabled);
  const primaryActions = enabledActions.slice(0, 2);
  const secondaryActions = enabledActions.slice(2);

  return (
    <div className="pf-v6-l-flex pf-m-align-items-center pf-m-gap-sm">
      {/* Selection info */}
      <Split hasGutter>
        <SplitItem>
          <Badge isRead>
            {selectedCount} of {totalCount} selected
          </Badge>
        </SplitItem>
        <SplitItem>
          <Button
            variant="link"
            icon={<TimesIcon />}
            onClick={onClearSelection}
          >
            Clear selection
          </Button>
        </SplitItem>
        {showSelectAllPages && selectedCount < totalCount && (
          <SplitItem>
            <Button
              variant="link"
              onClick={onSelectAllPages}
            >
              Select all {totalCount} items
            </Button>
          </SplitItem>
        )}
      </Split>

      {/* Primary actions */}
      {primaryActions.length > 0 && (
        <div className="pf-v6-l-flex pf-m-gap-sm">
          {primaryActions.map((action) => (
            <Button
              key={action.id}
              variant={action.destructive ? 'danger' : 'secondary'}
              onClick={() => onActionClick(action)}
              isDisabled={action.disabled}
              title={action.disabledReason}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Secondary actions dropdown */}
      {secondaryActions.length > 0 && (
        <Dropdown
          isOpen={isActionsOpen}
          onOpenChange={setIsActionsOpen}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              variant="secondary"
              icon={<EllipsisVIcon />}
            >
              More actions
            </MenuToggle>
          )}
        >
          <DropdownList>
            {secondaryActions.map((action) => (
              <DropdownItem
                key={action.id}
                onClick={() => {
                  onActionClick(action);
                  setIsActionsOpen(false);
                }}
                isDisabled={action.disabled}
                isDanger={action.destructive}
              >
                {action.label}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      )}
    </div>
  );
};