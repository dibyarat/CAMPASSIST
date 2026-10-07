import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';

// Controllers
import { UsersController } from './users/users.controller';
import { AttendanceController } from './attendance/attendance.controller';
import { DepartmentsController } from './departments/departments.controller';
import { SectionsController } from './sections/sections.controller';
import { TimetableController } from './timetable/timetable.controller';
import { RoomsController } from './rooms/rooms.controller';
import { ExamsController } from './exams/exams.controller';
import { SubmissionsController } from './submissions/submissions.controller';
import { PollsController } from './polls/polls.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { StudyosController } from './studyos/studyos.controller';
import { MapController } from './map/map.controller';
import { HealthController } from './health/health.controller';

// Services
import { UsersService } from './users/users.service';
import { AttendanceService } from './attendance/attendance.service';
import { DepartmentsService } from './departments/departments.service';
import { SectionsService } from './sections/sections.service';
import { TimetableService } from './timetable/timetable.service';
import { RoomsService } from './rooms/rooms.service';
import { ExamsService } from './exams/exams.service';
import { SubmissionsService } from './submissions/submissions.service';
import { PollsService } from './polls/polls.service';
import { NotificationsService } from './notifications/notifications.service';
import { StudyosService } from './studyos/studyos.service';
import { MapService } from './map/map.service';
import { InstitutionsModule } from './institutions/institutions.module';
import { SubjectsModule } from './subjects/subjects.module';

@Module({
  imports: [InstitutionsModule, SubjectsModule],
  controllers: [
    AppController,
    HealthController,
    UsersController,
    AttendanceController,
    DepartmentsController,
    SectionsController,
    TimetableController,
    RoomsController,
    ExamsController,
    SubmissionsController,
    PollsController,
    NotificationsController,
    StudyosController,
    MapController
  ],
  providers: [
    AppService,
    PrismaService,
    UsersService,
    AttendanceService,
    DepartmentsService,
    SectionsService,
    TimetableService,
    RoomsService,
    ExamsService,
    SubmissionsService,
    PollsService,
    NotificationsService,
    StudyosService,
    MapService
  ],
})
export class AppModule {}



