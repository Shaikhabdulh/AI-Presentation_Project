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