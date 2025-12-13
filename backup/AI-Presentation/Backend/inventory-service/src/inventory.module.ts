import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InventoryController } from './controllers/inventory.controller'
import { InventoryService } from './services/inventory.service'
import { InventoryItem } from './entities/inventory-item.entity'
import { InventoryLog } from './entities/inventory-log.entity'

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, InventoryLog])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}