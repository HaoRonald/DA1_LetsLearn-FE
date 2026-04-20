// Route Handler: POST /api/auth/login
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Email và mật khẩu là bắt buộc' },
      { status: 400 }
    );
  }

  // TODO: xác thực với DB, hash password...
  if (email === 'test@example.com' && password === '123456') {
    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token: 'mock-jwt-token',
        user: { id: '1', name: 'Test User', email, role: 'user' },
      },
    });
  }

  return NextResponse.json(
    { success: false, message: 'Email hoặc mật khẩu không đúng' },
    { status: 401 }
  );
}
