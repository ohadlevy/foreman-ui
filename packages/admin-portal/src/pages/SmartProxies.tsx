import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Spinner,
} from '@patternfly/react-core';
import { PlusCircleIcon, ServerIcon } from '@patternfly/react-icons';
import { 
  useSmartProxies, 
  useCreateSmartProxy,
  SmartProxiesTable,
  SmartProxyForm,
  SmartProxyFormData
} from '@foreman/shared';

export const SmartProxies: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  
  const { data: smartProxies, isLoading } = useSmartProxies();
  const createSmartProxy = useCreateSmartProxy();

  const handleCreate = async (data: SmartProxyFormData) => {
    try {
      await createSmartProxy.mutateAsync(data);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create smart proxy:', error);
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Smart Proxies
        </Title>
        <p>Manage Smart Proxies that provide DNS, DHCP, TFTP, and other infrastructure services</p>
      </PageSection>

      <PageSection>
        <Card>
          <CardTitle>
            Smart Proxy Management
            {!showForm && (
              <Button 
                variant="primary" 
                className="pf-v5-u-float-right"
                icon={<PlusCircleIcon />}
                onClick={() => setShowForm(true)}
              >
                Add Smart Proxy
              </Button>
            )}
          </CardTitle>
          <CardBody>
            {showForm ? (
              <SmartProxyForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                isLoading={createSmartProxy.isLoading}
                error={createSmartProxy.error as string}
              />
            ) : (
              <>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spinner size="lg" />
                  </div>
                ) : smartProxies?.results && smartProxies.results.length > 0 ? (
                  <SmartProxiesTable 
                    smartProxies={smartProxies.results}
                    isLoading={isLoading}
                  />
                ) : (
                  <EmptyState>
                    <EmptyStateIcon icon={ServerIcon} />
                    <Title headingLevel="h4" size="lg">
                      No Smart Proxies Found
                    </Title>
                    <EmptyStateBody>
                      Smart Proxies extend Foreman functionality to manage DNS, DHCP, TFTP and other services.
                      They act as a bridge between Foreman and your infrastructure services.
                    </EmptyStateBody>
                    <Button 
                      variant="primary" 
                      icon={<PlusCircleIcon />}
                      onClick={() => setShowForm(true)}
                    >
                      Add Your First Smart Proxy
                    </Button>
                  </EmptyState>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};