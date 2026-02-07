import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, sessionKey, accessToken } = body;

    // Support both OAuth tokens and session cookies
    if (!orgId || (!sessionKey && !accessToken)) {
      return NextResponse.json(
        { error: 'Missing orgId or authentication' },
        { status: 400 }
      );
    }

    // Build headers based on auth method
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    };

    if (accessToken) {
      // OAuth token method
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      // Session cookie method
      headers['Cookie'] = `sessionKey=${sessionKey}`;
    }

    const response = await fetch(
      `https://claude.ai/api/organizations/${orgId}/usage`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Claude API error:', response.status, text);
      return NextResponse.json(
        { error: `Claude API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the response to our format
    const usage = {
      fiveHour: data.five_hour ? {
        utilization: data.five_hour.utilization,
        resetsAt: data.five_hour.resets_at || null,
      } : null,
      sevenDay: data.seven_day ? {
        utilization: data.seven_day.utilization,
        resetsAt: data.seven_day.resets_at || null,
      } : null,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching Claude Max usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
