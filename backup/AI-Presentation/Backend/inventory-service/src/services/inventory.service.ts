import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InventoryItem } from '../entities/inventory-item.entity'
import { InventoryLog } from '../entities/inventory-log.entity'
import { CreateItemDto } from '../dtos/create-item.dto'

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private itemRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryLog)
    private logRepository: Repository<InventoryLog>,
  ) {}

  async getAllItems(userId: string) {
    return this.itemRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    })
  }

  async getItemById(id: string, userId: string) {
    const item = await this.itemRepository.findOne({
      where: { id, userId },
    })

    if (!item) {
      throw new NotFoundException('Item not found')
    }

    return item
  }

  async createItem(createItemDto: CreateItemDto, userId: string) {
    const item = this.itemRepository.create({
      ...createItemDto,
      userId,
    })

    const saved = await this.itemRepository.save(item)

    // Log creation
    await this.logRepository.save({
      itemId: saved.id,
      userId,
      previousQuantity: 0,
      newQuantity: createItemDto.quantity,
      reason: 'Initial stock',
    })

    return saved
  }

  async updateQuantity(id: string, quantity: number, userId: string, reason: string) {
    const item = await this.getItemById(id, userId)

    if (quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative')
    }

    const previousQuantity = item.quantity
    item.quantity = quantity
    await this.itemRepository.save(item)

    // Log the change
    await this.logRepository.save({
      itemId: id,
      userId,
      previousQuantity,
      newQuantity: quantity,
      reason,
    })

    // Check if low stock and emit notification
    if (item.quantity <= item.minThreshold) {
      // Emit event for notification service
      console.log(`Low stock alert for ${item.name}`)
    }

    return item
  }

  async getLowStockItems(userId: string) {
    return this.itemRepository
      .createQueryBuilder('item')
      .where('item.userId = :userId', { userId })
      .andWhere('item.quantity <= item.minThreshold')
      .orderBy('item.quantity', 'ASC')
      .getMany()
  }

  async deleteItem(id: string, userId: string) {
    const item = await this.getItemById(id, userId)
    await this.itemRepository.remove(item)
  }

  async getInventoryLogs(itemId: string, userId: string) {
    return this.logRepository.find({
      where: { itemId, userId },
      order: { createdAt: 'DESC' },
    })
  }
}