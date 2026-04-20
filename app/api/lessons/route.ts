// Route Handler: GET /api/lessons
// Docs: app/01-getting-started/15-route-handlers.md
import { NextRequest, NextResponse } from 'next/server';

// Mock data - thay bằng DB thật
const mockLessons = [
  { id: '1', title: 'Basic Greetings', description: 'Learn basic English greetings', level: 'beginner', createdAt: new Date().toISOString() },
  { id: '2', title: 'Daily Conversations', description: 'Common daily conversations', level: 'intermediate', createdAt: new Date().toISOString() },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const start = (page - 1) * limit;
  const data = mockLessons.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    message: 'OK',
    data: {
      data,
      total: mockLessons.length,
      page,
      limit,
      totalPages: Math.ceil(mockLessons.length / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate
  if (!body.title || !body.level) {
    return NextResponse.json(
      { success: false, message: 'title và level là bắt buộc' },
      { status: 400 }
    );
  }

  const newLesson = {
    id: Date.now().toString(),
    ...body,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, message: 'Tạo bài học thành công', data: newLesson }, { status: 201 });
}
