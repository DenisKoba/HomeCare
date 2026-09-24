import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  controllers: [ProfilesController, DevicesController],
  providers: [ProfilesService, DevicesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
