import { NotFoundException } from '@nestjs/common';

export default function NotFoundGuard(entity: any, message: string) {
  if (!entity) {
    throw new NotFoundException(message);
  }
}
