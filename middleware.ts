import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Логирование входящего запроса
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📥 [${new Date().toISOString()}]`);
  console.log(`   ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search}`);
  console.log(`   IP: ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`);
  console.log(`   User-Agent: ${request.headers.get('user-agent') || 'unknown'}`);
  
  const response = NextResponse.next();
  
  // Логирование времени обработки
  const duration = Date.now() - start;
  console.log(`✅ Completed in ${duration}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return response;
}

// Конфигурация - какие пути обрабатывать
export const config = {
  matcher: [
    /*
     * Обрабатываем все запросы кроме:
     * - _next/static (статические файлы)
     * - _next/image (оптимизация изображений)
     * - favicon.ico (иконка)
     * - файлы с расширениями (png, jpg, jpeg, gif, svg, webp, ico, woff, woff2)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)).*)',
  ],
};

