import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser, Public, UsuarioLogado } from '../common/auth';
import { LoginDto, RegistrarDto } from './auth.dto';
import { AuthService } from './auth.service';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('registrar')
  registrar(@Body() dto: RegistrarDto) {
    return this.auth.registrar(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @SkipThrottle()
  @Get('me')
  me(@CurrentUser() user: UsuarioLogado) {
    return this.auth.me(user.id);
  }
}
