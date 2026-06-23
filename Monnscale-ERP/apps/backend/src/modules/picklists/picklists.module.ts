import { Module } from '@nestjs/common';
import { PicklistsController } from './picklists.controller';
import { PicklistsService } from './picklists.service';

@Module({
  controllers: [PicklistsController],
  providers: [PicklistsService],
  exports: [PicklistsService],
})
export class PicklistsModule {}
