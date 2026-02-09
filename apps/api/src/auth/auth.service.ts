import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { Role, UserStatus } from '@repo/db';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

/**
 * AuthService - 身份认证服务
 * @Injectable() 装饰器将该类标记为“提供者 (Provider)”，
 * 使其能够被 NestJS 的 IoC (控制反转) 容器管理，并注入到其他模块中。
 */
@Injectable()
export class AuthService {
  /**
   * 构造函数：利用依赖注入 (Dependency Injection) 引入必要的服务实例
   * @param prisma - 数据库访问服务。用于在认证过程中查询用户信息（如验证账号密码）。
   * @param jwtService - NestJS 官方 JWT 插件。用于生成（sign）和验证（verify）访问令牌。
   */
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { username: dto.username },
    });
    // 1. 检查用户名是否被占用
    if (existingUser) {
      throw new BadRequestException('Username is already taken');
    }

    // 2. 检查教师验证码是否有效
    if (dto.role === Role.TEACHER) {
      if (!dto.inviteCode) {
        throw new BadRequestException(
          'invite code is required for teacher registration',
        );
      }

      const codeRecord = await this.prisma.client.inviteCode.findUnique({
        where: { code: dto.inviteCode },
      });

      if (!codeRecord) throw new BadRequestException('Invalid invite code');
      if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt)
        throw new BadRequestException('Invite code expired');
      if (codeRecord.isUsed)
        throw new BadRequestException('Invite code has already been used');

      // 更新验证码状态
      await this.prisma.client.inviteCode.update({
        where: { id: codeRecord.id },
        data: { isUsed: true },
      });
    }

    // 3. 密码哈希加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // 4. 创建用户
    const newUser = await this.prisma.client.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        nickname: dto.nickname,
        role: dto.role || Role.STUDENT,
        avatar: '',
      },
    });

    // 5. 注册成功响应
    return {
      message: 'Registration successful',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
    };
  }

  async login(dto: LoginDto) {
    // 1. 查找用户
    const user = await this.prisma.client.user.findUnique({
      where: { username: dto.username },
    });

    if (!user) throw new UnauthorizedException('Invalid username or password');

    // 2. 核对密码
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid username or password');

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(
        'Account is banned, please contact administrator',
      );
    }

    // 3. 生成 Token
    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    // 4. 成功响应
    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        avater: user.avatar,
      },
    };
  }
}
