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

// If we want to optimize further, we could add a dedicated stats query
export const GET_HOST_COUNTS = `
  query GetHostCounts(
    $organizationId: ID
    $locationId: ID
  ) {
    hostStats(
      organizationId: $organizationId
      locationId: $locationId
    ) {
      total
      enabled
      building
      disabled
    }
  }
`;