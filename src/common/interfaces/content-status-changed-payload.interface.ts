import { Status } from 'generated/prisma/client';

export interface ContentStatusChangePayload {
  contentId: number;
  from: Status;
  to: Status;
  userId: number;
  timestamp?: Date;
  id?: number;
  status?: Status;
  author?: { id: number; name: string };
}
