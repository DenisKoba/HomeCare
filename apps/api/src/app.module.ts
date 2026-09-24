import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/auth/auth.guard';
import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { HouseholdsModule } from './modules/households/households.module';
import { PlansModule } from './modules/plans/plans.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    ProfilesModule,
    HouseholdsModule,
    RoomsModule,
    TasksModule,
    PlansModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
