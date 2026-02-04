import { SetMetadata } from '@nestjs/common';
import { MESSAGE_KEY } from '../utils/keys.utils';

export const MessageResponse = () => SetMetadata(MESSAGE_KEY, true);
