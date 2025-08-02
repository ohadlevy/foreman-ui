import { createForemanClient, ForemanAPIClient } from './client';
import type { NotificationRecipient } from '../stores/notificationStore';

export interface NotificationResponse {
  notifications: NotificationRecipient[];
}

export class NotificationAPI {
  private client: ForemanAPIClient;

  constructor() {
    const token = localStorage.getItem('foreman_auth_token');
    this.client = createForemanClient({ 
      baseURL: '', // Use empty base URL since we're proxying from root
      token: token || undefined,
    });
  }

  /**
   * Update the client token (useful when token changes)
   */
  updateToken() {
    const token = localStorage.getItem('foreman_auth_token');
    if (token) {
      this.client.setToken(token);
    } else {
      this.client.clearToken();
    }
  }

  /**
   * Fetch all notifications for the current user
   */
  async getNotifications(): Promise<NotificationResponse> {
    const response = await this.client.get<NotificationResponse>('/notification_recipients');
    return response;
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id: number): Promise<void> {
    await this.client.put(`/notification_recipients/${id}`, { seen: true });
  }

  /**
   * Clear (delete) a specific notification
   */
  async clearNotification(id: number): Promise<void> {
    await this.client.delete(`/notification_recipients/${id}`);
  }

  /**
   * Mark all notifications in a group as read
   */
  async markGroupAsRead(group: string): Promise<void> {
    await this.client.put(`/notification_recipients/group/${encodeURIComponent(group)}`);
  }

  /**
   * Clear (delete) all notifications in a group
   */
  async clearGroup(group: string): Promise<void> {
    await this.client.delete(`/notification_recipients/group/${encodeURIComponent(group)}`);
  }
}

// Export singleton instance
export const notificationAPI = new NotificationAPI();