import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable } from '@nestjs/common'
import { NotificationService } from './services/notification.service'

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  private userSockets: Map<string, string> = new Map()

  constructor(private notificationService: NotificationService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
    // Remove from user sockets
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId)
      }
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, data: { userId: string }) {
    this.userSockets.set(data.userId, client.id)
    client.join(`user:${data.userId}`)
    console.log(`User ${data.userId} subscribed to notifications`)
  }

  async broadcastNotification(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId)
    if (socketId) {
      this.server.to(`user:${userId}`).emit('new_notification', notification)
    }
  }

  async broadcastToVendor(vendorId: string, notification: any) {
    this.server.to(`vendor:${vendorId}`).emit('vendor_contact_request', notification)
  }
}