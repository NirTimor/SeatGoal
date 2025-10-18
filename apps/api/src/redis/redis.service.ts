import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly SEAT_HOLD_PREFIX = 'seat:hold:';
  private readonly RATE_LIMIT_PREFIX = 'rate:';
  private readonly DEFAULT_HOLD_TTL = 600; // 10 minutes

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('🔌 Redis disconnected');
  }

  /**
   * Hold a seat for a user session
   * Uses SETNX (SET if Not eXists) for atomic operation
   */
  async holdSeat(
    eventId: string,
    seatId: string,
    sessionId: string,
    ttl: number = this.DEFAULT_HOLD_TTL,
  ): Promise<boolean> {
    const key = `${this.SEAT_HOLD_PREFIX}${eventId}:${seatId}`;
    const result = await this.client.set(key, sessionId, 'EX', ttl, 'NX');
    return result === 'OK';
  }

  /**
   * Hold multiple seats atomically
   */
  async holdSeats(
    eventId: string,
    seatIds: string[],
    sessionId: string,
    ttl: number = this.DEFAULT_HOLD_TTL,
  ): Promise<{ success: boolean; heldSeats: string[]; failedSeats: string[] }> {
    const pipeline = this.client.pipeline();
    const heldSeats: string[] = [];
    const failedSeats: string[] = [];

    // Try to hold all seats
    for (const seatId of seatIds) {
      const key = `${this.SEAT_HOLD_PREFIX}${eventId}:${seatId}`;
      pipeline.set(key, sessionId, 'EX', ttl, 'NX');
    }

    const results = await pipeline.exec();

    // Check results
    seatIds.forEach((seatId, index) => {
      const [err, result] = results[index];
      if (!err && result === 'OK') {
        heldSeats.push(seatId);
      } else {
        failedSeats.push(seatId);
      }
    });

    // If any seat failed, release all held seats
    if (failedSeats.length > 0) {
      await this.releaseSeats(eventId, heldSeats, sessionId);
      return { success: false, heldSeats: [], failedSeats: seatIds };
    }

    return { success: true, heldSeats, failedSeats: [] };
  }

  /**
   * Release a seat hold
   */
  async releaseSeat(
    eventId: string,
    seatId: string,
    sessionId: string,
  ): Promise<boolean> {
    const key = `${this.SEAT_HOLD_PREFIX}${eventId}:${seatId}`;
    
    // Use Lua script to ensure we only delete if the session matches
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.client.eval(script, 1, key, sessionId);
    return result === 1;
  }

  /**
   * Release multiple seats
   */
  async releaseSeats(
    eventId: string,
    seatIds: string[],
    sessionId: string,
  ): Promise<number> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    let released = 0;
    for (const seatId of seatIds) {
      const key = `${this.SEAT_HOLD_PREFIX}${eventId}:${seatId}`;
      const result = await this.client.eval(script, 1, key, sessionId);
      if (result === 1) released++;
    }

    return released;
  }

  /**
   * Extend seat hold TTL
   */
  async extendHold(
    eventId: string,
    seatId: string,
    sessionId: string,
    ttl: number = this.DEFAULT_HOLD_TTL,
  ): Promise<boolean> {
    const key = `${this.SEAT_HOLD_PREFIX}${eventId}:${seatId}`;
    
    // Use Lua script to extend only if session matches
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    
    const result = await this.client.eval(script, 1, key, sessionId, ttl);
    return result === 1;
  }

  /**
   * Check if a seat is held
   */
  async isSeatHeld(eventId: string, seatId: string): Promise<boolean> {
    const key = `${this.SEAT_HOLD_PREFIX}${eventId}:${seatId}`;
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  /**
   * Get who holds a seat
   */
  async getSeatHolder(eventId: string, seatId: string): Promise<string | null> {
    const key = `${this.SEAT_HOLD_PREFIX}${eventId}:${seatId}`;
    return await this.client.get(key);
  }

  /**
   * Get TTL for a seat hold
   */
  async getSeatHoldTTL(eventId: string, seatId: string): Promise<number> {
    const key = `${this.SEAT_HOLD_PREFIX}${eventId}:${seatId}`;
    return await this.client.ttl(key);
  }

  /**
   * Rate limiting by IP
   * Returns true if request is allowed, false if rate limit exceeded
   */
  async checkRateLimit(
    ip: string,
    maxRequests: number = 100,
    windowSeconds: number = 60,
  ): Promise<boolean> {
    const key = `${this.RATE_LIMIT_PREFIX}${ip}`;
    
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, windowSeconds);
    }
    
    return current <= maxRequests;
  }

  /**
   * Generic cache get
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as any;
    }
  }

  /**
   * Generic cache set
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) return 0;
    
    return await this.client.del(...keys);
  }
}

