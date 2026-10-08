import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const requestId = request.id || (request.headers['x-request-id'] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = (
          Array.isArray(body['message'])
            ? body['message'].join(', ')
            : body['message'] || exception.message
        ) as string;
        errorName = (body['error'] || exception.name) as string;
      }
    } else if (exception instanceof Error) {
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : exception.message;
      errorName = exception.name;
    }

    // Log the error internally with request-id, but never send stack trace to client
    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} - Status ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId,
      message,
      error: errorName,
    });
  }
}
