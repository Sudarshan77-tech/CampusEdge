import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const port = configService.get<number>('PORT', 4000);
  const webOrigin = configService.get<string>('WEB_ORIGIN', 'http://localhost:3000');

  // Security Headers
  app.use(helmet());

  // CORS limited to web origin
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-college-id'],
  });

  // Request-ID and Pino logging
  app.use(
    pinoHttp({
      genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
      transport:
        nodeEnv !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
              },
            }
          : undefined,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Swagger Documentation (disabled in production)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CampusEdge API')
      .setDescription('CampusEdge College Placement Intelligence Engine API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);
  // Do not log secrets, only port and environment
  // eslint-disable-next-line no-console
  console.log(`[CampusEdge API] Server listening on port ${port} in ${nodeEnv} mode`);
}

bootstrap();
