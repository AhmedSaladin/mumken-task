import { BadRequestException } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';

export default function UserCannotEditGuard(
  createdById: number,
  userId: number,
  role: string,
  errorMessage: string,
) {
  if (createdById !== userId && role !== Role.ADMIN) {
    throw new BadRequestException(errorMessage);
  }
}
