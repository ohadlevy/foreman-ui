/**
 * GraphQL queries for Hosts List page - optimized for table display
 */

// Hosts list page needs all the fields shown in the table columns
export const GET_HOSTS_LIST = `
  query GetHostsList(
    $first: Int
    $after: String
    $search: String
  ) {
    hosts(
      first: $first
      after: $after
      search: $search
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          name
          ip
          build
          enabled
          createdAt
          updatedAt
          lastReport
          
          # Related entities - only names needed for table columns
          operatingsystem {
            name
          }
          hostgroup {
            name
          }
          organization {
            name
          }
          location {
            name
          }
          owner {
            ... on User {
              name: login
            }
            ... on Usergroup {
              name
            }
          }
        }
      }
    }
  }
`;

// For bulk operations, we need to fetch target data with reasonable limits
export const GET_BULK_OPERATION_TARGETS = `
  query GetBulkOperationTargets(
    $hostgroupsFirst: Int = 100
    $usersFirst: Int = 100
    $organizationsFirst: Int = 50
    $locationsFirst: Int = 50
  ) {
    hostgroups(first: $hostgroupsFirst) {
      edges {
        node {
          id
          name
          title
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    organizations(first: $organizationsFirst) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    locations(first: $locationsFirst) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    users(first: $usersFirst) {
      edges {
        node {
          id
          login
          firstname
          lastname
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;