import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegistrarDto {
  @IsString() @MinLength(2) @MaxLength(120)
  organizacao!: string;

  @IsString() @MinLength(2) @MaxLength(120)
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString() @MinLength(8) @MaxLength(72)
  senha!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString() @MinLength(1) @MaxLength(72)
  senha!: string;
}
