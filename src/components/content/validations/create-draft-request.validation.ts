import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { Sector } from 'generated/prisma/enums';

export class CreateContentValidation {
  @ApiProperty({
    description: 'title of the content',
    minLength: 3,
    type: String,
    required: true,
  })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    description: 'body of the content',
    minLength: 10,
    type: String,
    required: true,
  })
  @IsString()
  @MinLength(10)
  body: string;

  @ApiProperty({
    enum: Sector,
    description: 'sector of the content',
    type: String,
    required: true,
  })
  @IsEnum(Sector)
  sector: Sector;
}
