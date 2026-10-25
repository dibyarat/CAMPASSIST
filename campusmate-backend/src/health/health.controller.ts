import { Controller, Get, Optional } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';
import { PrismaService } from '../common/prisma.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private firebase: FirebaseAdminService,
    @Optional() private prisma?: PrismaService,
  ) {}

  @Get()
  async checkHealth() {
    let firestoreStatus = 'disconnected';
    let postgresStatus = 'disconnected';
    
    try {
      await this.firebase.firestore.collection('_health').limit(1).get();
      firestoreStatus = 'connected';
    } catch {
      firestoreStatus = 'error';
    }

    let dbLatencyMs: number | null = null;
    const dbStartTime = Date.now();

    if (this.prisma) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        postgresStatus = 'connected';
        dbLatencyMs = Date.now() - dbStartTime;
      } catch {
        postgresStatus = 'error';
      }
    } else {
      postgresStatus = 'not_configured';
    }

    const overallDb =
      firestoreStatus === 'connected' && (postgresStatus === 'connected' || postgresStatus === 'not_configured')
        ? 'connected'
        : firestoreStatus === 'connected' || postgresStatus === 'connected'
          ? 'degraded'
          : 'error';

    return {
      status: overallDb === 'error' ? 'error' : 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: overallDb,
        databaseLatencyMs: dbLatencyMs,
        firestore: firestoreStatus,
        postgres: postgresStatus,
        api: 'running',
      },
    };
  }
}

