# Manual Verification Checklist for Mode Switching

This document provides a manual test script to verify that the route-based mode switching functionality works correctly.

## Prerequisites

1. **Foreman instance running** on `http://localhost:3000`
2. **User-portal dev server** running on `http://localhost:3003` (or any available port)
3. **Valid Foreman credentials** (admin user preferred for full testing)

## Test Script

### 1. Authentication Tests

#### 1.1 Login Page Display
- [ ] Navigate to `http://localhost:3003`
- [ ] **VERIFY**: Login form displays with:
  - [ ] Foreman branding/logo
  - [ ] Username field
  - [ ] Password field with show/hide toggle
  - [ ] "Sign in" button
  - [ ] Footer links (About, Documentation, Help)

#### 1.2 Login Validation
- [ ] Click "Sign in" without entering credentials
- [ ] **VERIFY**: Error message shows "Please enter both username and password"
- [ ] Enter username only, click "Sign in"
- [ ] **VERIFY**: Same validation error appears
- [ ] Enter password only, click "Sign in"  
- [ ] **VERIFY**: Same validation error appears

#### 1.3 Successful Login
- [ ] Enter valid Foreman credentials
- [ ] Click "Sign in"
- [ ] **VERIFY**: 
  - [ ] No page refresh occurs
  - [ ] Redirects to `/user/dashboard`
  - [ ] User portal interface loads
  - [ ] No console errors

#### 1.4 Invalid Login
- [ ] Logout and return to login
- [ ] Enter invalid credentials
- [ ] Click "Sign in"
- [ ] **VERIFY**: Error message displays with appropriate error text

### 2. Route-Based Navigation Tests

#### 2.1 Default Redirects
- [ ] Navigate directly to `http://localhost:3003/`
- [ ] **VERIFY**: Redirects to `/user/dashboard`
- [ ] Navigate to `http://localhost:3003/dashboard`
- [ ] **VERIFY**: Redirects to `/user/dashboard`
- [ ] Navigate to `http://localhost:3003/unknown-path`
- [ ] **VERIFY**: Redirects to `/user/dashboard`

#### 2.2 User Mode Routes
- [ ] Navigate to `/user/dashboard`
- [ ] **VERIFY**: Dashboard page loads
- [ ] Navigate to `/user/hosts` (if permissions allow)
- [ ] **VERIFY**: Hosts page loads
- [ ] Navigate to `/user/profile`
- [ ] **VERIFY**: Profile page loads
- [ ] Navigate to `/user/settings`
- [ ] **VERIFY**: Settings page loads
- [ ] Navigate to `/user/system-status`
- [ ] **VERIFY**: System Status page loads

#### 2.3 Admin Mode Routes
- [ ] Navigate to `/admin/overview`
- [ ] **VERIFY**: Admin portal placeholder loads with:
  - [ ] "Admin Portal" heading
  - [ ] "The admin portal is currently under development" message

### 3. Mode Switcher Tests

#### 3.1 Admin User Mode Switcher
**Note**: Only works for users with admin privileges

- [ ] Login with admin user
- [ ] Navigate to `/user/dashboard`
- [ ] **VERIFY**: Mode switcher is visible in header with:
  - [ ] Toggle switch (unchecked for user mode)
  - [ ] "User Mode" label (blue)
  - [ ] User and Admin icons

#### 3.2 Mode Switching from User to Admin
- [ ] From user mode, click the mode switcher toggle
- [ ] **VERIFY**:
  - [ ] URL changes to `/admin/overview`
  - [ ] Admin portal content loads
  - [ ] Toggle switch is now checked
  - [ ] Label shows "Admin Mode" (red)

#### 3.3 Mode Switching from Admin to User
- [ ] From admin mode, click the mode switcher toggle
- [ ] **VERIFY**:
  - [ ] URL changes to `/user/dashboard`
  - [ ] User portal content loads
  - [ ] Toggle switch is unchecked
  - [ ] Label shows "User Mode" (blue)

#### 3.4 Mode Switcher Tooltip
- [ ] Hover over mode switcher in user mode
- [ ] **VERIFY**: Tooltip shows "Switch to Admin Portal"
- [ ] Switch to admin mode
- [ ] Hover over mode switcher
- [ ] **VERIFY**: Tooltip shows "Switch to User Portal"

#### 3.5 Non-Admin User
- [ ] Login with non-admin user
- [ ] **VERIFY**: Mode switcher is NOT visible anywhere in the interface

### 4. URL Direct Access Tests

#### 4.1 Direct Admin Access
- [ ] Login as admin user
- [ ] Navigate directly to `/admin/overview` via URL bar
- [ ] **VERIFY**: Admin portal loads correctly
- [ ] **VERIFY**: Mode switcher shows "Admin Mode"

#### 4.2 Direct User Access  
- [ ] From admin mode, navigate directly to `/user/dashboard` via URL bar
- [ ] **VERIFY**: User portal loads correctly
- [ ] **VERIFY**: Mode switcher shows "User Mode"

### 5. Browser Navigation Tests

#### 5.1 Back/Forward Navigation
- [ ] Start in user mode (`/user/dashboard`)
- [ ] Switch to admin mode (`/admin/overview`)
- [ ] Click browser back button
- [ ] **VERIFY**: Returns to user mode with correct UI state
- [ ] Click browser forward button
- [ ] **VERIFY**: Returns to admin mode with correct UI state

#### 5.2 Refresh Tests
- [ ] In user mode, refresh the page
- [ ] **VERIFY**: Stays in user mode, no auth required
- [ ] Switch to admin mode, refresh the page  
- [ ] **VERIFY**: Stays in admin mode, no auth required

### 6. Error Handling Tests

#### 6.1 Plugin Loading Errors
- [ ] Check browser console during app load
- [ ] **VERIFY**: Any plugin errors are non-blocking (app still functions)
- [ ] **VERIFY**: Plugin registration success messages appear

#### 6.2 Network Error Handling
- [ ] Disconnect network after login
- [ ] Try switching modes
- [ ] **VERIFY**: App handles network errors gracefully

### 7. Accessibility Tests

#### 7.1 Keyboard Navigation
- [ ] Use Tab key to navigate login form
- [ ] **VERIFY**: Proper focus order and visual focus indicators
- [ ] Use Enter key to submit login
- [ ] **VERIFY**: Form submits correctly
- [ ] Tab to mode switcher (admin users)
- [ ] Use Enter/Space to toggle
- [ ] **VERIFY**: Mode switching works via keyboard

#### 7.2 Screen Reader Support
- [ ] Check mode switcher has proper aria-label
- [ ] **VERIFY**: "Toggle between User and Admin mode"

## Success Criteria

✅ **All tests pass** = Mode switching implementation is working correctly
❌ **Any test fails** = Implementation needs fixes

## Common Issues and Solutions

- **Login redirects to login page**: Check Foreman API connectivity
- **Mode switcher not visible**: Verify user has admin privileges  
- **Console errors**: Check QueryClient setup and component mounting order
- **Navigation not working**: Verify React Router configuration

## Performance Notes

- [ ] App loads quickly (< 2 seconds)
- [ ] Mode switching is instantaneous
- [ ] No unnecessary re-renders or API calls during mode switching
- [ ] Plugin loading doesn't block main functionality