import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserRequest } from '../interfaces/user-request.interface';
export const GetUser = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request: UserRequest = ctx.switchToHttp().getRequest();

    if (key && request.user) return request?.user[key];
    return request.user;
  },
);
