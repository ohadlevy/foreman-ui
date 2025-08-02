import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDefaultClient } from '../api/client';
import { useAuth } from '../auth/useAuth';

export interface PersonalAccessToken {
  id: number;
  name: string;
  token_value?: string; // Only visible when first created
  token?: string; // Fallback for different API versions
  'active?': boolean; // Foreman uses "active?" with question mark
  active?: boolean; // Fallback for different API versions
  'revoked?': boolean; // Foreman uses "revoked?" with question mark
  revoked?: boolean; // Fallback for different API versions
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface PersonalAccessTokensResponse {
  total: number;
  subtotal: number;
  page: number;
  per_page: number;
  search: string;
  sort: {
    by: string;
    order: string;
  };
  results: PersonalAccessToken[];
}

export const usePersonalAccessTokens = () => {
  const client = createDefaultClient();
  const { user } = useAuth();

  const tokensQuery = useQuery({
    queryKey: ['personalAccessTokens', user?.id],
    queryFn: async (): Promise<PersonalAccessTokensResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return client.get(`/users/${user.id}/personal_access_tokens`);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    tokens: tokensQuery.data?.results || [],
    isLoading: tokensQuery.isLoading,
    error: tokensQuery.error,
    refetch: tokensQuery.refetch,
  };
};

export const useRevokePersonalAccessToken = () => {
  const client = createDefaultClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tokenId: number) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return client.delete(`/users/${user.id}/personal_access_tokens/${tokenId}`);
    },
    onSuccess: () => {
      // Refresh the tokens list
      queryClient.invalidateQueries({ queryKey: ['personalAccessTokens', user?.id] });
    },
  });
};

export const useCurrentToken = () => {
  const { tokens } = usePersonalAccessTokens();
  const currentTokenValue = localStorage.getItem('foreman_auth_token');
  
  // Find the current token by matching the actual stored token value
  const currentToken = tokens.find(token => 
    // First try to match the actual token value (most reliable)
    token.token_value === currentTokenValue ||
    // Fallback: use stored token ID if available
    (localStorage.getItem('foreman_auth_token_id') && 
     token.id.toString() === localStorage.getItem('foreman_auth_token_id')) ||
    // Last fallback: newest active Foreman UI token
    (token.name?.includes('Foreman UI') && token['active?'] !== false && token.active !== false)
  );

  return {
    currentToken,
    currentTokenValue,
    isCurrentTokenActive: currentToken?.['active?'] !== false && currentToken?.active !== false,
  };
};