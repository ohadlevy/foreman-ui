/**
 * GraphQL queries for Dashboard page - minimal fields for performance
 */

// Dashboard only needs host counts using proper Foreman search syntax
export const GET_DASHBOARD_HOST_STATS = `
  query GetDashboardHostStats {
    hosts {
      totalCount
    }
    enabledHosts: hosts(search: "status.enabled = true") {
      totalCount
    }
    buildingHosts: hosts(search: "build = true") {
      totalCount
    }
  }
`;
