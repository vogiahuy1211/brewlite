import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.users.create({
      data: {
        email: dto.email.toLowerCase(),
        password_hash,
      },
      select: {
        id: true,
        email: true,
        loyalty_points: true,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user,
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        loyalty_points: user.loyalty_points,
      },
      access_token: token,
    };
  }
}
