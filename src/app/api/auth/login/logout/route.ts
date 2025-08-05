import { NextResponse } from 'next/server';

export async function POST() {
  const options = {
    name: 'session',
    value: '',
    maxAge: -1, // Expire the cookie immediately
    httpOnly: true,
    secure: true,
  };

  const response = NextResponse.json({ status: 'success' });
  response.cookies.set(options);
  return response;
}