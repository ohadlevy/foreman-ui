import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ForemanAPIClient } from '../client';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Foreman API Endpoints', () => {
  let client: ForemanAPIClient;
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    head: vi.fn(),
    options: vi.fn(),
    getUri: vi.fn(),
    create: vi.fn(),
    defaults: {} as any,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockedAxios.create).mockReturnValue(mockAxiosInstance);
    
    client = new ForemanAPIClient({
      baseURL: '/api/v2',
      username: 'testuser',
      password: 'testpass',
    });
  });

  describe('Host Management Endpoints', () => {
    it('should get hosts list with Foreman pagination', async () => {
      const mockHostsResponse = {
        total: 150,
        subtotal: 20,
        page: 1,
        per_page: 20,
        search: '',
        sort: {
          by: 'name',
          order: 'asc'
        },
        results: [
          {
            id: 1,
            name: 'web01.example.com',
            ip: '192.168.1.10',
            mac: '00:50:56:12:34:56',
            environment_name: 'production',
            operatingsystem_name: 'RHEL 8.5',
            hostgroup_name: 'Web Servers',
            organization_name: 'ACME Corp',
            location_name: 'Datacenter 1',
            enabled: true,
            managed: true,
            build: false,
            last_report: '2025-08-01T17:30:00Z',
            global_status: 0,
            global_status_label: 'OK'
          },
          {
            id: 2,
            name: 'db01.example.com',
            ip: '192.168.1.20',
            mac: '00:50:56:12:34:57',
            environment_name: 'production',
            operatingsystem_name: 'RHEL 8.5',
            hostgroup_name: 'Database Servers',
            organization_name: 'ACME Corp',
            location_name: 'Datacenter 1',
            enabled: true,
            managed: true,
            build: false,
            last_report: '2025-08-01T17:25:00Z',
            global_status: 1,
            global_status_label: 'Warning'
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockHostsResponse });

      const result = await client.getPaginated('/hosts', {
        page: 1,
        per_page: 20,
        search: 'environment = production'
      }) as typeof mockHostsResponse;

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/hosts', {
        params: {
          page: 1,
          per_page: 20,
          search: 'environment = production'
        }
      });

      expect(result).toEqual(mockHostsResponse);
      expect(result.results).toHaveLength(2);
      expect(result.total).toBe(150);
    });

    it('should get individual host details', async () => {
      const mockHost = {
        id: 1,
        name: 'web01.example.com',
        ip: '192.168.1.10',
        ip6: '2001:db8::1',
        mac: '00:50:56:12:34:56',
        domain_id: 1,
        domain_name: 'example.com',
        environment_id: 1,
        environment_name: 'production',
        operatingsystem_id: 1,
        operatingsystem_name: 'RHEL 8.5',
        architecture_id: 1,
        architecture_name: 'x86_64',
        hostgroup_id: 5,
        hostgroup_name: 'Web Servers',
        organization_id: 1,
        organization_name: 'ACME Corp',
        location_id: 2,
        location_name: 'Datacenter 1',
        owner_id: 5,
        owner_name: 'ohad',
        enabled: true,
        managed: true,
        build: false,
        use_image: false,
        comment: 'Primary web server',
        created_at: '2025-07-15T10:00:00Z',
        updated_at: '2025-08-01T16:00:00Z',
        last_report: '2025-08-01T17:30:00Z',
        last_compile: '2025-08-01T17:28:00Z',
        global_status: 0,
        global_status_label: 'OK',
        configuration_status: 0,
        configuration_status_label: 'Active',
        build_status: 0,
        build_status_label: 'Installed',
        puppet_ca_proxy_id: 1,
        puppet_proxy_id: 1,
        certname: 'web01.example.com',
        interfaces: [
          {
            id: 1,
            mac: '00:50:56:12:34:56',
            ip: '192.168.1.10',
            type: 'interface',
            name: 'eth0',
            subnet_id: 1,
            subnet_name: 'Production Network',
            domain_id: 1,
            identifier: 'eth0',
            managed: true,
            primary: true,
            provision: true
          }
        ],
        parameters: [
          {
            id: 10,
            name: 'application_tier',
            value: 'web',
            parameter_type: 'string'
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockHost });

      const result = await client.get('/hosts/1') as typeof mockHost;

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/hosts/1', undefined);
      expect(result).toEqual(mockHost);
      expect((result as typeof mockHost).name).toBe('web01.example.com');
      expect((result as typeof mockHost).interfaces).toHaveLength(1);
    });

    it('should create new host', async () => {
      const newHostData = {
        host: {
          name: 'web03.example.com',
          ip: '192.168.1.30',
          mac: '00:50:56:12:34:58',
          environment_id: 1,
          operatingsystem_id: 1,
          architecture_id: 1,
          hostgroup_id: 5,
          organization_id: 1,
          location_id: 2,
          enabled: true,
          managed: true,
          build: false
        }
      };

      const createdHost = {
        id: 3,
        ...newHostData.host,
        created_at: '2025-08-01T18:00:00Z',
        global_status: 0
      };

      mockAxiosInstance.post.mockResolvedValue({ data: createdHost });

      const result = await client.post('/hosts', newHostData) as Record<string, unknown>;

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/hosts', newHostData, undefined);
      expect(result).toEqual(createdHost);
      expect(result.id).toBe(3);
    });

    it('should handle host power operations', async () => {
      const powerAction = { power_action: 'start' };
      const powerResult = {
        message: 'Host web01.example.com is starting...',
        task_id: 'uuid-12345-67890'
      };

      mockAxiosInstance.put.mockResolvedValue({ data: powerResult });

      const result = await client.put('/hosts/1/power', powerAction) as typeof powerResult;

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/hosts/1/power', powerAction, undefined);
      expect(result.message).toContain('starting');
    });
  });

  describe('Organization and Location Context', () => {
    it('should get organizations list', async () => {
      const mockOrgsResponse = {
        total: 5,
        subtotal: 5,
        page: 1,
        per_page: 20,
        results: [
          {
            id: 1,
            name: 'Default Organization',
            title: 'Default Organization',
            description: 'Default organization for Foreman',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-08-01T12:00:00Z',
            hosts_count: 25,
            users_count: 8
          },
          {
            id: 2,
            name: 'ACME Corp',
            title: 'ACME Corporation',
            description: 'Production environment for ACME',
            created_at: '2025-02-01T00:00:00Z',
            updated_at: '2025-08-01T15:00:00Z',
            hosts_count: 100,
            users_count: 15
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockOrgsResponse });

      const result = await client.get('/organizations') as typeof mockOrgsResponse;

      expect(result.results).toHaveLength(2);
      expect(result.results[0].name).toBe('Default Organization');
    });

    it('should get locations list', async () => {
      const mockLocationsResponse = {
        total: 3,
        subtotal: 3,
        page: 1,
        per_page: 20,
        results: [
          {
            id: 1,
            name: 'Default Location',
            title: 'Default Location',
            description: 'Default location for Foreman',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-08-01T12:00:00Z',
            hosts_count: 50
          },
          {
            id: 2,
            name: 'Datacenter 1',
            title: 'Primary Datacenter',
            description: 'Main production datacenter',
            created_at: '2025-02-01T00:00:00Z',
            updated_at: '2025-08-01T15:00:00Z',
            hosts_count: 75
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockLocationsResponse });

      const result = await client.get('/locations') as typeof mockLocationsResponse;

      expect(result.results).toHaveLength(2);
      expect(result.results[1].name).toBe('Datacenter 1');
    });
  });

  describe('Puppet Integration Endpoints', () => {
    it('should get environments list', async () => {
      const mockEnvironmentsResponse = {
        total: 4,
        subtotal: 4,
        page: 1,
        per_page: 20,
        results: [
          {
            id: 1,
            name: 'production',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-08-01T10:00:00Z',
            hosts_count: 80
          },
          {
            id: 2,
            name: 'development',
            created_at: '2025-01-15T00:00:00Z',
            updated_at: '2025-08-01T14:00:00Z',
            hosts_count: 20
          },
          {
            id: 3,
            name: 'staging',
            created_at: '2025-02-01T00:00:00Z',
            updated_at: '2025-08-01T16:00:00Z',
            hosts_count: 15
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockEnvironmentsResponse });

      const result = await client.get('/environments') as typeof mockEnvironmentsResponse;

      expect(result.results).toHaveLength(3);
      expect(result.results[0].name).toBe('production');
    });

    it('should get hostgroups with puppet classes', async () => {
      const mockHostgroupsResponse = {
        total: 6,
        subtotal: 6,
        page: 1,
        per_page: 20,
        results: [
          {
            id: 1,
            name: 'Base',
            title: 'Base Configuration',
            description: 'Base hostgroup with common settings',
            environment_id: 1,
            environment_name: 'production',
            operatingsystem_id: 1,
            operatingsystem_name: 'RHEL 8.5',
            hosts_count: 0,
            children_count: 3,
            puppetclasses: [
              {
                id: 1,
                name: 'ntp',
                module_name: 'puppetlabs-ntp'
              },
              {
                id: 5,
                name: 'sudo',
                module_name: 'saz-sudo'
              }
            ]
          },
          {
            id: 5,
            name: 'Web Servers',
            title: 'Web Server Configuration',
            description: 'Configuration for Apache web servers',
            parent_id: 1,
            environment_id: 1,
            environment_name: 'production',
            operatingsystem_id: 1,
            operatingsystem_name: 'RHEL 8.5',
            hosts_count: 10,
            children_count: 0,
            puppetclasses: [
              {
                id: 10,
                name: 'apache',
                module_name: 'puppetlabs-apache'
              },
              {
                id: 15,
                name: 'firewall',
                module_name: 'puppetlabs-firewall'
              }
            ]
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockHostgroupsResponse });

      const result = await client.get('/hostgroups') as typeof mockHostgroupsResponse;

      expect(result.results).toHaveLength(2);
      expect(result.results[1].puppetclasses).toHaveLength(2);
      expect(result.results[1].puppetclasses[0].name).toBe('apache');
    });
  });

  describe('Reports and Facts Endpoints', () => {
    it('should get config reports', async () => {
      const mockReportsResponse = {
        total: 1000,
        subtotal: 25,
        page: 1,
        per_page: 25,
        results: [
          {
            id: 12345,
            host_id: 1,
            host_name: 'web01.example.com',
            reported_at: '2025-08-01T17:30:00Z',
            status: {
              applied: 5,
              restarted: 2,
              failed: 0,
              failed_restarts: 0,
              skipped: 1,
              pending: 0
            },
            metrics: {
              time: {
                total: 45.67,
                config_retrieval: 2.34,
                catalog_application: 43.33
              },
              resources: {
                total: 150
              }
            },
            environment_name: 'production',
            puppet_version: '7.18.0'
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockReportsResponse });

      const result = await client.get('/config_reports', {
        params: { 'search': 'host = web01.example.com' }
      }) as typeof mockReportsResponse;

      expect(result.results[0].status.applied).toBe(5);
      expect(result.results[0].metrics.time.total).toBe(45.67);
    });

    it('should get host facts', async () => {
      const mockFactsResponse = {
        'web01.example.com': {
          architecture: 'x86_64',
          bios_release_date: '04/01/2014',
          bios_vendor: 'Phoenix Technologies LTD',
          bios_version: '6.00',
          blockdevice_sda_size: '21474836480',
          domain: 'example.com',
          fqdn: 'web01.example.com',
          hostname: 'web01',
          ipaddress: '192.168.1.10',
          ipaddress_eth0: '192.168.1.10',
          kernel: 'Linux',
          kernelrelease: '4.18.0-348.el8.x86_64',
          kernelversion: '4.18.0',
          macaddress: '00:50:56:12:34:56',
          macaddress_eth0: '00:50:56:12:34:56',
          memoryfree: '2.50 GiB',
          memorysize: '4.00 GiB',
          netmask: '255.255.255.0',
          operatingsystem: 'RedHat',
          operatingsystemrelease: '8.5',
          osfamily: 'RedHat',
          physicalprocessorcount: '2',
          processor0: 'Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz',
          processorcount: '2',
          productname: 'VMware Virtual Platform',
          uptime: '15 days',
          uptime_days: '15',
          uptime_hours: '360',
          uptime_seconds: '1296000',
          virtual: 'vmware'
        }
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockFactsResponse });

      const result = await client.get('/hosts/1/facts') as typeof mockFactsResponse;

      expect(result['web01.example.com'].fqdn).toBe('web01.example.com');
      expect(result['web01.example.com'].operatingsystem).toBe('RedHat');
      expect(result['web01.example.com'].virtual).toBe('vmware');
    });
  });

  describe('Error Handling for Foreman Specific Scenarios', () => {
    it('should handle organization context not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            error: {
              message: 'Organization not found or not accessible'
            }
          }
        }
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(client.get('/hosts')).rejects.toThrow();
    });

    it('should handle insufficient permissions for resource', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            error: {
              message: 'Access denied. You need view_hosts permission to perform this action.'
            }
          }
        }
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(client.get('/hosts/1')).rejects.toThrow();
    });

    it('should handle Foreman validation errors', async () => {
      const invalidHostData = {
        host: {
          name: '', // Invalid: empty name
          mac: 'invalid-mac-format'
        }
      };

      const mockError = {
        response: {
          status: 422,
          data: {
            error: {
              message: 'Validation failed',
              details: {
                name: ["can't be blank"],
                mac: ["is invalid"]
              }
            }
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(client.post('/hosts', invalidHostData)).rejects.toThrow();
    });

    it('should handle Puppet environment conflicts', async () => {
      const mockError = {
        response: {
          status: 409,
          data: {
            error: {
              message: 'Environment production is not available for this host group'
            }
          }
        }
      };

      mockAxiosInstance.put.mockRejectedValue(mockError);

      await expect(client.put('/hosts/1', {
        host: { environment_id: 999 }
      })).rejects.toThrow();
    });
  });

  describe('Search and Filtering', () => {
    it('should handle Foreman search syntax', async () => {
      const searchQueries = [
        'name ~ web*',
        'environment = production',
        'hostgroup = "Web Servers"',
        'organization = "ACME Corp" and location = "Datacenter 1"',
        'last_report > "1 week ago"',
        'status.failed > 0',
        'facts.architecture = x86_64'
      ];

      for (const search of searchQueries) {
        mockAxiosInstance.get.mockResolvedValue({
          data: { total: 10, results: [] }
        });

        await client.getPaginated('/hosts', { search }) as { total: number; results: unknown[] };

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/hosts', {
          params: { search }
        });
      }
    });

    it('should handle complex sorting options', async () => {
      const sortOptions = [
        { sort: { by: 'name', order: 'asc' } },
        { sort: { by: 'last_report', order: 'desc' } },
        { sort: { by: 'environment_name', order: 'asc' } }
      ];

      for (const sortOption of sortOptions) {
        mockAxiosInstance.get.mockResolvedValue({
          data: { total: 10, results: [] }
        });

        await client.getPaginated('/hosts', sortOption) as { total: number; results: unknown[] };

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/hosts', {
          params: sortOption
        });
      }
    });
  });
});