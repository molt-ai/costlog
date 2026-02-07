// Claude OAuth PKCE implementation
// Based on Claude Code CLI's OAuth flow

const CLAUDE_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const CLAUDE_AUTH_URL = 'https://claude.ai/oauth/authorize';
const CLAUDE_TOKEN_URL = 'https://console.anthropic.com/api/oauth/token';

// Generate cryptographically secure random string
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

// Generate PKCE code verifier
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

// Generate PKCE code challenge from verifier
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Base64url encode
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Build authorization URL
export async function buildAuthUrl(redirectUri: string): Promise<{ url: string; verifier: string; state: string }> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomString(32);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLAUDE_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'user:inference user:profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: state,
  });
  
  return {
    url: `${CLAUDE_AUTH_URL}?${params.toString()}`,
    verifier,
    state,
  };
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  verifier: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  orgId: string;
}> {
  const response = await fetch(CLAUDE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: CLAUDE_CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    orgId: data.organization?.uuid || '',
  };
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch(CLAUDE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLAUDE_CLIENT_ID,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}
