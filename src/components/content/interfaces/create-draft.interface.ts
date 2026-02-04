import { Sector } from 'generated/prisma/enums';

export interface CreateDraftInterface {
  title: string;
  body: string;
  sector: Sector;
}
