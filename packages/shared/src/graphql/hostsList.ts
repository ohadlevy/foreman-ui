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

// For bulk operations, we need to fetch target data (only supported fields)
export const GET_BULK_OPERATION_TARGETS = `
  query GetBulkOperationTargets {
    hostgroups {
      edges {
        node {
          id
          name
          title
        }
      }
    }
    organizations {
      edges {
        node {
          id
          name
        }
      }
    }
    locations {
      edges {
        node {
          id
          name
        }
      }
    }
    users {
      edges {
        node {
          id
          login
          firstname
          lastname
        }
      }
    }
    usergroups {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;