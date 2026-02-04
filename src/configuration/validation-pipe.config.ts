import { BadRequestException, ValidationPipeOptions } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export default {
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    return new BadRequestException(
      validationErrors[0]?.constraints?.[
        Object.keys(validationErrors[0]?.constraints)[0]
      ],
    );
  },
} as ValidationPipeOptions;
