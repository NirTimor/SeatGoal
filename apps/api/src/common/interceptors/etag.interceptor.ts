import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createHash } from 'crypto';

/**
 * ETag Interceptor
 * Automatically generates ETag headers based on response body
 * Implements HTTP 304 Not Modified for unchanged resources
 */
@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Generate ETag from response data
        const etag = this.generateETag(data);

        // Set ETag header
        response.setHeader('ETag', etag);

        // Check if client sent If-None-Match header
        const clientETag = request.headers['if-none-match'];

        if (clientETag && clientETag === etag) {
          // Resource hasn't changed, return 304
          response.status(304);
          return null;
        }

        return data;
      }),
    );
  }

  private generateETag(data: any): string {
    const hash = createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `"${hash}"`;
  }
}
