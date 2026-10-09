import { Controller, Get } from '@nestjs/common';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Controller('health')
export class HealthController {
  constructor(private firebase: FirebaseAdminService) {}

  @Get()
  async checkHealth() {
    let dbStatus = 'disconnected';
    
    try {
      await this.firebase.firestore.collection('_health').limit(1).get();
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'running'
      }
    };
  }
}

