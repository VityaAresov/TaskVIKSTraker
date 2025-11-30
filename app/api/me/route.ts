import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Failed to load current user', error);
    return NextResponse.json(
      { error: 'Failed to load user. Check Supabase environment variables are configured.' },
      { status: 500 }
    );
  }
}
