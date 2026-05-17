import { verifyUsage } from '@/app/actions/userActions';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await verifyUsage('pdf');
    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 403 });
  }
}