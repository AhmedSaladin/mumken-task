import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import errorCode from './errorCode';
import { MESSAGE_KEY } from '../utils/keys.utils';
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((res: unknown) => this.responseHandler(res, context)),
      catchError((err: HttpException) =>
        throwError(() => this.errorHandler(err, context)),
      ),
    );
  }

  errorHandler(exception: HttpException, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = errorCode(exception);

    response.status(status).json({
      success: false,
      message: message,
      date: new Date().toISOString(),
    });
  }

  responseHandler(res: any, context: ExecutionContext) {
    const isMessage = this.reflector.get<boolean>(
      MESSAGE_KEY,
      context.getHandler(),
    );

    return {
      success: true,
      message: isMessage ? res : undefined,
      data: !isMessage ? res : undefined,
    };
  }
}
