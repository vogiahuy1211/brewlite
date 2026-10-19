import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'brewlite_super_secret_jwt_key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, loyalty_points: true },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc phiên đăng nhập đã hết hạn');
    }

    return user;
  }
}
