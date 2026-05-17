import { decrementUsage } from '@/app/actions/userActions';
import { NextResponse } from 'next/server';

export async function POST() {
  await decrementUsage('pdf');
  return new NextResponse('OK', { status: 200 });
}