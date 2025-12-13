# Backend Microservices - NestJS Implementation
# Done
## Architecture Overview

```
Backend Services:
├── API Gateway (Port 3000) - Routes requests to services
├── Auth Service (Port 3100) - JWT & user authentication
├── Inventory Service (Port 3101) - Stock management
├── Vendor Service (Port 3103) - Vendor management
└── Notification Service (Port 3102) - Real-time alerts
```

## 1. Auth Service (`backend/auth-service/`)

### `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AuthModule } from './auth.module'

async function bootstrap() {
  const app = await NestFactory.create(AuthModule)
  
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.enableCors()
  
  await app.listen(3100)
  console.log('Auth Service running on port 3100')
}

bootstrap()
```

### `src/auth.module.ts`
```typescript
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthController } from './controllers/auth.controller'
import { AuthService } from './services/auth.service'
import { User } from './entities/user.entity'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret-key',
      signOptions: { expiresIn: '1h' },
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### `src/entities/user.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  name: string

  @Column()
  password: string

  @Column({ type: 'enum', enum: ['admin', 'user', 'vendor'], default: 'user' })
  role: 'admin' | 'user' | 'vendor'

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

### `src/services/auth.service.ts`
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { User } from '../entities/user.entity'
import { RegisterDto } from '../dtos/register.dto'
import { LoginDto } from '../dtos/login.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    })

    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    })

    const savedUser = await this.userRepository.save(user)

    // Generate token
    const token = this.jwtService.sign({
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    })

    return {
      user: this.sanitizeUser(savedUser),
      token,
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Generate token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      user: this.sanitizeUser(user),
      token,
    }
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token)
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }

  async verifyUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('User not found')
    }
    return this.sanitizeUser(user)
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user
    return sanitized
  }
}
```

### `src/controllers/auth.controller.ts`
```typescript
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { JwtAuthGuard } from '../guards/jwt.guard'
import { RegisterDto } from '../dtos/register.dto'
import { LoginDto } from '../dtos/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@Request() req) {
    return this.authService.verifyUser(req.user.sub)
  }
}
```

## 2. Inventory Service (`backend/inventory-service/`)

### `src/inventory.module.ts`
```typescript
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
```

### `src/entities/inventory-item.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'int' })
  quantity: number

  @Column({ type: 'int' })
  minThreshold: number

  @Column()
  unit: string

  @Column()
  category: string

  @Column({ type: 'uuid' })
  userId: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  get isLowStock(): boolean {
    return this.quantity <= this.minThreshold
  }
}
```

### `src/services/inventory.service.ts`
```typescript
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
```

## 3. Vendor Service (`backend/vendor-service/`)

### `src/entities/vendor.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column()
  phone: string

  @Column()
  category: string

  @Column()
  address: string

  @Column()
  city: string

  @Column({ type: 'decimal', default: 0 })
  rating: number

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  registeredAt: Date
}
```

### `src/entities/vendor-contact-request.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Vendor } from './vendor.entity'

@Entity('vendor_contact_requests')
export class VendorContactRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  vendorId: string

  @Column({ type: 'uuid' })
  itemId: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'int' })
  quantity: number

  @Column({ type: 'text' })
  message: string

  @Column({ type: 'enum', enum: ['pending', 'responded', 'fulfilled'], default: 'pending' })
  status: 'pending' | 'responded' | 'fulfilled'

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor
}
```

### `src/services/vendor.service.ts`
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Vendor } from '../entities/vendor.entity'
import { VendorContactRequest } from '../entities/vendor-contact-request.entity'
import { RegisterVendorDto } from '../dtos/register-vendor.dto'

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorContactRequest)
    private contactRequestRepository: Repository<VendorContactRequest>,
  ) {}

  async registerVendor(registerDto: RegisterVendorDto) {
    // Check if vendor already exists
    const existingVendor = await this.vendorRepository.findOne({
      where: { email: registerDto.email },
    })

    if (existingVendor) {
      throw new ConflictException('Vendor already registered')
    }

    const vendor = this.vendorRepository.create(registerDto)
    return this.vendorRepository.save(vendor)
  }

  async getAllVendors() {
    return this.vendorRepository.find({
      where: { isActive: true },
      order: { rating: 'DESC' },
    })
  }

  async getVendorsByCategory(category: string) {
    return this.vendorRepository.find({
      where: { category, isActive: true },
      order: { rating: 'DESC' },
    })
  }

  async getVendorById(id: string) {
    const vendor = await this.vendorRepository.findOne({ where: { id } })

    if (!vendor) {
      throw new NotFoundException('Vendor not found')
    }

    return vendor
  }

  async contactVendor(vendorId: string, userId: string, contactData: any) {
    const vendor = await this.getVendorById(vendorId)

    const contactRequest = this.contactRequestRepository.create({
      vendorId,
      userId,
      ...contactData,
    })

    // Emit notification event for vendor
    console.log(`New contact request for vendor ${vendor.name}`)

    return this.contactRequestRepository.save(contactRequest)
  }

  async getVendorContactRequests(vendorId: string) {
    return this.contactRequestRepository.find({
      where: { vendorId },
      relations: ['vendor'],
      order: { createdAt: 'DESC' },
    })
  }

  async updateRequestStatus(requestId: string, status: 'pending' | 'responded' | 'fulfilled') {
    const request = await this.contactRequestRepository.findOne({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundException('Request not found')
    }

    request.status = status
    return this.contactRequestRepository.save(request)
  }
}
```

## 4. Notification Service (`backend/notification-service/`)

### `src/notification.gateway.ts`
```typescript
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
```

### `src/services/notification.service.ts`
```typescript
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
```

## 5. API Gateway (`backend/api-gateway/`)

### `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core'
import { ApiGatewayModule } from './api-gateway.module'

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule)
  
  app.enableCors()
  
  // Setup routes to microservices
  const httpAdapter = app.get('HttpAdapter')
  
  // Route to services
  app.use('/api/auth', (req, res, next) => {
    // Proxy to auth service
  })
  
  await app.listen(3000)
  console.log('API Gateway running on port 3000')
}

bootstrap()
```

---

**SOLID Principles Applied**:

1. **Single Responsibility**: Each service handles one domain
2. **Open/Closed**: Extensible through modules and services
3. **Liskov Substitution**: Services can be replaced with implementations
4. **Interface Segregation**: Specific DTOs and interfaces
5. **Dependency Inversion**: Dependency injection throughout

