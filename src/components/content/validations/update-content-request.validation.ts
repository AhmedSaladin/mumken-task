import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateContentValidation {
  @ApiProperty({
    description: 'title of the content',
    minLength: 3,
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiProperty({
    description: 'body of the content',
    minLength: 10,
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  body?: string;
}
