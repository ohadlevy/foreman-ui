import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Form,
  FormGroup,
  Radio,
  Switch,
  Grid,
  GridItem,
  Content,
  ContentVariants,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useUserSettingsStore, ThemeMode, SUPPORTED_LANGUAGES } from '../stores/userSettingsStore';

export const Settings: React.FC = () => {
  const { getCurrentUserSettings, setTheme, setLanguage, updateUserSettings, currentUserId } = useUserSettingsStore();
  const currentSettings = getCurrentUserSettings();
  const [isLanguageSelectOpen, setIsLanguageSelectOpen] = React.useState(false);

  const handleThemeChange = (theme: ThemeMode) => {
    setTheme(theme);
  };

  const handleLanguageChange = (language: string) => {
    setLanguage(language);
    setIsLanguageSelectOpen(false);
  };

  const handleNotificationChange = (type: 'desktop' | 'email' | 'sound', checked: boolean) => {
    if (currentUserId) {
      updateUserSettings(currentUserId, {
        notificationPreferences: {
          desktop: true,
          email: true,
          sound: false,
          ...currentSettings.notificationPreferences,
          [type]: checked,
        },
      });
    }
  };

  const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === currentSettings.language);
  const selectedLanguageLabel = selectedLanguage 
    ? selectedLanguage.nativeName
    : '🇺🇸 English';

  return (
    <>
      <PageSection variant="secondary">
        <Title headingLevel="h1" size="2xl">
          Settings
        </Title>
        <Content component={ContentVariants.p}>
          Customize your Foreman experience with these personal preferences.
        </Content>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          <GridItem xl={6} lg={8} md={12}>
            <Card>
              <CardTitle>Appearance</CardTitle>
              <CardBody>
                <Form>
                  <FormGroup
                    label="Theme"
                    fieldId="theme-options"
                  >
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                      Choose how Foreman UI appears. System will follow your browser&apos;s preference.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <Radio
                        id="theme-light"
                        name="theme"
                        label="Light theme"
                        isChecked={currentSettings.theme === 'light'}
                        onChange={() => handleThemeChange('light')}
                      />
                      <Radio
                        id="theme-dark"
                        name="theme"
                        label="Dark theme"
                        isChecked={currentSettings.theme === 'dark'}
                        onChange={() => handleThemeChange('dark')}
                      />
                      <Radio
                        id="theme-system"
                        name="theme"
                        label="Follow system preference"
                        isChecked={currentSettings.theme === 'system'}
                        onChange={() => handleThemeChange('system')}
                      />
                    </div>
                  </FormGroup>
                  
                  <FormGroup
                    label="Language"
                    fieldId="language-select"
                  >
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                      Choose your preferred language for the interface.
                    </div>
                    <Select
                      id="language-select"
                      isOpen={isLanguageSelectOpen}
                      selected={currentSettings.language}
                      onSelect={(_event, selection) => handleLanguageChange(selection as string)}
                      onOpenChange={(isOpen) => setIsLanguageSelectOpen(isOpen)}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsLanguageSelectOpen(!isLanguageSelectOpen)}
                          isExpanded={isLanguageSelectOpen}
                          style={{ minWidth: '250px' }}
                        >
                          {selectedLanguageLabel}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        {SUPPORTED_LANGUAGES.map((language) => (
                          <SelectOption
                            key={language.code}
                            value={language.code}
                          >
                            {language.nativeName}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  </FormGroup>
                </Form>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem xl={6} lg={8} md={12}>
            <Card>
              <CardTitle>Notifications</CardTitle>
              <CardBody>
                <Form>
                  <FormGroup
                    label="Notification preferences"
                    fieldId="notification-options"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <Switch
                        id="desktop-notifications"
                        label="Desktop notifications"
                        isChecked={currentSettings.notificationPreferences?.desktop ?? true}
                        onChange={(_, checked) => handleNotificationChange('desktop', checked)}
                      />
                      <Switch
                        id="email-notifications"
                        label="Email notifications"
                        isChecked={currentSettings.notificationPreferences?.email ?? true}
                        onChange={(_, checked) => handleNotificationChange('email', checked)}
                      />
                      <Switch
                        id="sound-notifications"
                        label="Sound notifications"
                        isChecked={currentSettings.notificationPreferences?.sound ?? false}
                        onChange={(_, checked) => handleNotificationChange('sound', checked)}
                      />
                    </div>
                  </FormGroup>
                </Form>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};