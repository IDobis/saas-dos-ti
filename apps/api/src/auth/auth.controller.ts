import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, Public, UsuarioLogado } from '../common/auth';
import { LoginDto, RegistrarDto } from './auth.dto';
import { AuthService } from './auth.service';

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

  @Get('me')
  me(@CurrentUser() user: UsuarioLogado) {
    return this.auth.me(user.id);
  }
}
