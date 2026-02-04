import { SetMetadata } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { ROLES_KEY } from '../utils/keys.utils';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
