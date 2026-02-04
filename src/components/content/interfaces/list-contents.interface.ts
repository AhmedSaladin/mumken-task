import { Sector, Status } from 'generated/prisma/enums';

export interface ListContentsInterface {
  filters: {
    status?: Status;
    sector?: Sector;
  };
  skip: number;
  limit: number;
}
