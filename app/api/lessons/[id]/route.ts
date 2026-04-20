// Route Handler: GET/PUT/DELETE /api/lessons/[id]
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/lessons/[id]'>
) {
  const { id } = await ctx.params;
  // TODO: lấy từ DB
  return NextResponse.json({ success: true, message: 'OK', data: { id, title: 'Mock lesson' } });
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<'/api/lessons/[id]'>
) {
  const { id } = await ctx.params;
  const body = await request.json();
  return NextResponse.json({ success: true, message: 'Cập nhật thành công', data: { id, ...body } });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/lessons/[id]'>
) {
  const { id } = await ctx.params;
  // TODO: xóa khỏi DB
  return NextResponse.json({ success: true, message: `Đã xóa bài học ${id}` });
}
