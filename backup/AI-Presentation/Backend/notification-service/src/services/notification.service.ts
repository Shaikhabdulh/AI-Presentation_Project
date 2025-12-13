import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from '../entities/notification.entity'

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(notification: Partial<Notification>) {
    const newNotification = this.notificationRepository.create(notification)
    return this.notificationRepository.save(newNotification)
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    })
  }

  async markAsRead(notificationId: string) {
    await this.notificationRepository.update(
      { id: notificationId },
      { read: true },
    )
  }

  async deleteNotification(notificationId: string) {
    await this.notificationRepository.delete(notificationId)
  }

  async sendLowStockAlert(userId: string, itemName: string, itemId: string) {
    return this.createNotification({
      userId,
      type: 'low_stock',
      message: `Low stock alert: ${itemName}`,
      itemId,
      read: false,
    })
  }

  async sendVendorContactNotification(vendorId: string, clientName: string, quantity: number) {
    return this.createNotification({
      userId: vendorId,
      type: 'vendor_request',
      message: `New contact request from ${clientName} for ${quantity} units`,
      read: false,
    })
  }
}