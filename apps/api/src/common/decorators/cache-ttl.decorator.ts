import { SetMetadata } from '@nestjs/common';
import { CACHE_TTL_METADATA } from '../interceptors/cache-control.interceptor';

/**
 * Decorator to set Cache-Control max-age for a route
 * @param ttl - Time to live in seconds
 *
 * @example
 * @CacheTTL(300) // Cache for 5 minutes
 * @Get()
 * async findAll() {
 *   return this.service.findAll();
 * }
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);
