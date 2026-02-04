import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Sector, Status } from 'generated/prisma/client';

export class ListContentValidation {
  @ApiProperty({
    enum: Status,
    description: 'status of the content',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({
    enum: Sector,
    description: 'sector of the content',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEnum(Sector)
  sector?: Sector;

  @ApiProperty({
    description: 'page number for pagination',
    type: Number,
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'number of items per page for pagination',
    type: Number,
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
