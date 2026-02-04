import {
  Injectable,
  CanActivate,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'generated/prisma/enums';
import { ROLES_KEY } from '../utils/keys.utils';
import ErrorMessage from '../utils/error.message';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException(ErrorMessage.USER_NOT_FOUND_AUTH);
    }

    const doesUserCanAccess = requiredRoles.some((role) => user.role === role);
    if (!doesUserCanAccess) {
      throw new InternalServerErrorException(ErrorMessage.ROLE_NOT_ALLOWED);
    }

    return true;
  }
}
