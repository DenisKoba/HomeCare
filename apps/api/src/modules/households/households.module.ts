import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { HouseholdAccessService } from './household-access.service';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { HouseholdCollaborationController } from './household-collaboration.controller';
import { HouseholdCollaborationService } from './household-collaboration.service';

@Module({
  imports: [ProfilesModule],
  controllers: [HouseholdsController, HouseholdCollaborationController],
  providers: [HouseholdsService, HouseholdAccessService, HouseholdCollaborationService],
  exports: [HouseholdsService, HouseholdAccessService],
})
export class HouseholdsModule {}
