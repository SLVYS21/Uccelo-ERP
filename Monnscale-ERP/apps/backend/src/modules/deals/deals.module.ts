import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';
import { PipelinesModule } from '../pipelines/pipelines.module';

@Module({
  imports: [CustomFieldsModule, PipelinesModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
