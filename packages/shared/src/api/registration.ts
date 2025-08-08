import { ForemanAPIClient } from './client';
import { RegistrationParams, GeneratedRegistrationCommand } from '../types';
import { API_ENDPOINTS } from '../constants';

export class RegistrationAPI {
  constructor(private client: ForemanAPIClient) {}

  // UI calls this to get the registration script from Foreman
  async generateCommand(params: RegistrationParams): Promise<GeneratedRegistrationCommand> {
    // Call POST /api/v2/registration_commands to get the registration script
    const response = await this.client.post<{ registration_command: string }>(API_ENDPOINTS.REGISTRATION_COMMANDS, params);

    // The response contains the actual script content that machines can run
    return {
      script: response.registration_command, // This is the actual script from Foreman (shell script with embedded tokens)
      parameters: params,
    };
  }
}