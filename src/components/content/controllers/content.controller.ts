import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { ContentService } from '../services/content.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/user.decorator';
import { ListContentValidation } from '../validations/list-content-request.validation';
import { UpdateContentValidation } from '../validations/update-content-request.validation';
import { CreateContentValidation } from '../validations/create-draft-request.validation';
import SuccessMessage from 'src/common/utils/success.message';
import { MessageResponse } from 'src/common/decorators/message-response.decorator';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import errorMessage from 'src/common/utils/error.message';
import Example from 'src/common/utils/message-response-example.utils';
import { ContentDto } from '../dtos/content.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('drafts')
  @MessageResponse()
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiOkResponse({
    example: Example(true, SuccessMessage.DRAFT_CREATED),
    description: 'Success message',
  })
  async createDraft(
    @Body() payload: CreateContentValidation,
    @GetUser('id') userId: number,
  ) {
    await this.contentService.createDraft(payload, userId);

    return SuccessMessage.DRAFT_CREATED;
  }

  @Put(':id')
  @Roles(Role.EDITOR, Role.ADMIN)
  @MessageResponse()
  @ApiOkResponse({
    example: Example(true, SuccessMessage.DRAFT_UPDATED),
    description: 'Success message',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
    example: Example(false, errorMessage.DRAFT_ONLY_EDITABLE),
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
    example: Example(false, errorMessage.CONTENT_NOT_FOUND),
  })
  async updateContent(
    @Param('id') id: number,
    @Body() payload: UpdateContentValidation,
    @GetUser() user: { id: number; role: string },
  ) {
    await this.contentService.updateContent({ ...payload, id }, user);

    return SuccessMessage.DRAFT_UPDATED;
  }

  @Post(':id/submit')
  @Roles(Role.EDITOR, Role.ADMIN)
  @MessageResponse()
  @ApiOkResponse({
    example: Example(true, SuccessMessage.CONTENT_STATUS_CHANGED),
    description: 'Success message',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
    example: Example(false, errorMessage.DRAFT_ONLY_SUBMIT),
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
    example: Example(false, errorMessage.CONTENT_NOT_FOUND),
  })
  async submitForReview(
    @Param('id') id: number,
    @GetUser() user: { id: number; role: string },
  ) {
    await this.contentService.submitForReview(id, user);

    return SuccessMessage.CONTENT_STATUS_CHANGED;
  }

  @Post(':id/approve')
  @Roles(Role.REVIEWER, Role.ADMIN)
  @MessageResponse()
  @ApiOkResponse({
    example: Example(true, SuccessMessage.CONTENT_APPROVED),
    description: 'Success message',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
    example: Example(false, errorMessage.IN_REVIEW_ONLY_APPROVE),
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
    example: Example(false, errorMessage.CONTENT_NOT_FOUND),
  })
  async approveContent(@Param('id') id: number, @GetUser('id') userId: number) {
    await this.contentService.approveContent(id, userId);

    return SuccessMessage.CONTENT_APPROVED;
  }

  @Get()
  @ApiOkResponse({
    description: 'List of contents with pagination',
    example: {
      success: true,
      data: [ContentDto],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  })
  @Roles(Role.EDITOR, Role.REVIEWER, Role.ADMIN)
  async listContent(@Query() query: ListContentValidation) {
    const { status, sector, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const filters = {};
    if (status) filters['status'] = status;
    if (sector) filters['sector'] = sector;

    const data = await this.contentService.listContents({
      filters,
      skip,
      limit,
    });

    return {
      data: data.contents,
      page,
      limit,
      total: data.total,
      totalPages: Math.ceil(data.total / limit),
    };
  }
}
