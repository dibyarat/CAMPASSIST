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
import { RemindersController } from './reminders/reminders.controller';

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
import { RemindersService } from './reminders/reminders.service';
import { EventsController } from './events/events.controller';
import { OffersController } from './offers/offers.controller';
import { EventsService } from './events/events.service';
import { OffersService } from './offers/offers.service';
import { AcademicTermsController } from './academic-terms/academic-terms.controller';
import { AcademicTermsService } from './academic-terms/academic-terms.service';
import { InstitutionsModule } from './institutions/institutions.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradesModule } from './grades/grades.module';
import { FeedbackModule } from './feedback/feedback.module';
import { FirebaseAdminModule } from './common/firebase/firebase-admin.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';

@Module({
  imports: [InstitutionsModule, SubjectsModule, GradesModule, FeedbackModule, FirebaseAdminModule, CloudinaryModule],
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
    MapController,
    RemindersController,
    EventsController,
    OffersController,
    AcademicTermsController
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
    MapService,
    RemindersService,
    EventsService,
    OffersService,
    AcademicTermsService
  ],
})
export class AppModule {}



