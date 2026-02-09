import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Role } from '@repo/db';

export class RegisterDto {
  @IsString()
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsString()
  @Length(6, 32, {
    message: 'Password must be between 6 and 32 characters long',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 20, {
    message: 'Nickname must be between 3 and 3 characters long',
  })
  nickname: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  inviteCode?: string;
}
