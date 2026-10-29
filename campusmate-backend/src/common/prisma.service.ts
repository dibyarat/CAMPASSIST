import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly queryCache = new Map<string, CacheEntry>();
  private readonly inFlightRequests = new Map<string, Promise<any>>();

  private readonly DEFAULT_TTL_MS = 30_000;
  private readonly MODEL_TTLS: Record<string, number> = {
    Institution: 60_000,
    Department: 60_000,
    Section: 60_000,
    AcademicTerm: 60_000,
    Subject: 60_000,
    Room: 60_000,
    User: 30_000,
    Profile: 30_000,
    Student: 30_000,
    CRAssignment: 30_000,
    Timetable: 30_000,
    AttendanceRecord: 20_000,
    Event: 30_000,
    Poll: 20_000,
    Reminder: 20_000,
    Offer: 45_000,
  };

  private readonly READ_ACTIONS = new Set(['findUnique', 'findFirst', 'findMany', 'count']);
  private readonly WRITE_ACTIONS = new Set([
    'create',
    'update',
    'delete',
    'upsert',
    'createMany',
    'updateMany',
    'deleteMany',
  ]);

  constructor() {
    super();
    this.setupCacheMiddleware();
  }

  private setupCacheMiddleware() {
    this.$use(async (params, next) => {
      const model = params.model;
      if (!model) return next(params);

      // Handle Read Queries with In-Memory TTL Cache and SingleFlight
      if (this.READ_ACTIONS.has(params.action)) {
        const key = this.getCacheKey(model, params.action, params.args);
        if (key) {
          const cached = this.queryCache.get(key);
          if (cached && Date.now() < cached.expiresAt) {
            return JSON.parse(JSON.stringify(cached.data));
          }

          // SingleFlight: Deduplicate concurrent identical in-flight queries
          if (this.inFlightRequests.has(key)) {
            const sharedResult = await this.inFlightRequests.get(key);
            return JSON.parse(JSON.stringify(sharedResult));
          }

          const queryPromise = next(params);
          this.inFlightRequests.set(key, queryPromise);

          try {
            const result = await queryPromise;
            const ttl = this.MODEL_TTLS[model] || this.DEFAULT_TTL_MS;
            this.queryCache.set(key, { data: result, expiresAt: Date.now() + ttl });
            return result;
          } finally {
            this.inFlightRequests.delete(key);
          }
        }
      }

      // Handle Write Mutations: Invalidate cache for the modified model and related models
      if (this.WRITE_ACTIONS.has(params.action)) {
        this.invalidateModel(model);
        return next(params);
      }

      return next(params);
    });
  }

  private getCacheKey(model: string, action: string, args: any): string | null {
    try {
      return `${model}:${action}:${JSON.stringify(args || {})}`;
    } catch {
      return null;
    }
  }

  public invalidateModel(model: string) {
    const prefix = `${model}:`;
    for (const key of this.queryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.queryCache.delete(key);
      }
    }

    // Invalidate related models for cross-model consistency
    if (model === 'Profile' || model === 'Student' || model === 'CRAssignment') {
      for (const key of this.queryCache.keys()) {
        if (key.startsWith('User:')) this.queryCache.delete(key);
      }
    } else if (model === 'User') {
      for (const key of this.queryCache.keys()) {
        if (key.startsWith('Profile:') || key.startsWith('Student:') || key.startsWith('CRAssignment:')) {
          this.queryCache.delete(key);
        }
      }
    } else if (model === 'Section') {
      for (const key of this.queryCache.keys()) {
        if (key.startsWith('Timetable:') || key.startsWith('Student:')) {
          this.queryCache.delete(key);
        }
      }
    }
  }

  public clearAllCache() {
    this.queryCache.clear();
    this.inFlightRequests.clear();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PrismaService connected with in-memory accelerated query cache');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.clearAllCache();
  }
}
