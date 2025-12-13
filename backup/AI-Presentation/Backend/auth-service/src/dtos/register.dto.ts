import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  name: string

  @IsEnum(['admin', 'user', 'vendor'])
  role: 'admin' | 'user' | 'vendor'
}