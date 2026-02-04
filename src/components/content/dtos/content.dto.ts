import { Expose, Transform } from 'class-transformer';

export class ContentDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  status: string;

  @Expose()
  sector: string;

  @Expose()
  @Transform(({ obj }) => obj.author)
  created_by: { id: number; name: string };

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
