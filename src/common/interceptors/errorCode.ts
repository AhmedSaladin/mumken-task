import { HttpException } from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
} from 'generated/prisma/internal/prismaNamespace';
import { PinoLogger } from 'nestjs-pino';

export default function (exception: HttpException) {
  let message = exception.message;
  const logger = new PinoLogger({});
  logger.setContext('database errors');

  if (exception instanceof PrismaClientValidationError) {
    message = 'Something went wrong with error code: 212';
    logger.error(exception);
  }

  if (exception instanceof PrismaClientKnownRequestError) {
    message = 'Something went wrong with error code: 213';
    logger.error(exception);
  }

  if (exception instanceof PrismaClientRustPanicError) {
    message = 'Something went wrong with error code: 🚨 214 🚨';
    logger.error(exception);
  }

  if (exception instanceof PrismaClientInitializationError) {
    message = 'Something went wrong with error code: 🚨 215 🚨';
    logger.error(exception);
  }

  if (exception instanceof PrismaClientUnknownRequestError) {
    message = 'Something went wrong with error code: 🚨 216 🚨';
    logger.error(exception);
  }

  return message;
}
