import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Cache-Control Interceptor
 * Adds Cache-Control headers based on route metadata
 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    // Get cache TTL from route metadata
    const cacheTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(() => {
        if (cacheTTL !== undefined) {
          // Set Cache-Control header
          response.setHeader(
            'Cache-Control',
            `public, max-age=${cacheTTL}, must-revalidate`,
          );
        }
      }),
    );
  }
}
