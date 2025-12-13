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