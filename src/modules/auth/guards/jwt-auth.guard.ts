import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest<TUser = any>(err: any, user: TUser, info: any, _context: ExecutionContext): TUser {
        if (err) throw err;

        if (!user) {
            if (info?.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token has expired. Please log in again.');
            }
            if (info?.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('Invalid token. Please log in again.');
            }
            if (info?.name === 'NotBeforeError') {
                throw new UnauthorizedException('Token not yet active.');
            }
            throw new UnauthorizedException('Authentication token is missing or invalid.');
        }

        return user;
    }
}

