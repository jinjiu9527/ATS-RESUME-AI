import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 定义需要登录访问的路径
const isProtectedRoute = createRouteMatcher(['/resume(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // 必须加 await 才能调用 .protect()
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // 跳过 Next.js 内部文件和所有静态文件
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // 始终运行 API 路由
    '/(api|trpc)(.*)',
  ],
};