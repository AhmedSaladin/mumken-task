import { BadRequestException } from '@nestjs/common';

export default function CannotBeEditableGuard(
  currentStatus: string,
  expectedStatus: string,
  errorMessage: string,
) {
  if (currentStatus !== expectedStatus) {
    throw new BadRequestException(errorMessage);
  }
}
