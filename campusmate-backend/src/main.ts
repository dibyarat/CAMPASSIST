import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Disable Express advertising header
  app.disable('x-powered-by');

  // Configure trust for single upstream reverse proxy hop (Render reverse proxy load balancer)
  app.set('trust proxy', 1);

  // Apply baseline security response headers across all routes
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
  });
  
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  const allowedOrigins = process.env.FRONTEND_ORIGINS?.split(',').map(origin => origin.trim()).filter(Boolean);
  app.enableCors({ origin: allowedOrigins?.length ? allowedOrigins : true });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
