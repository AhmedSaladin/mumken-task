import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from 'src/database/database.service';
import { CreateDraftInterface } from '../interfaces/create-draft.interface';
import { Status } from 'generated/prisma/client';
import {
  CONTENT_CRATED_EVENT,
  CONTENT_STATUS_CHANGED_EVENT,
  CONTENT_UPDATED_EVENT,
} from 'src/common/utils/keys.utils';
import { UpdateContentInterface } from '../interfaces/update-content.interface';
import NotFoundGuard from 'src/components/content/guards/not-found.guard';
import ErrorMessage from 'src/common/utils/error.message';
import CannotBeEditableGuard from '../guards/cannot-be-editable.guard';
import UserCannotEditGuard from '../guards/user-cannot-edit.guard';
import { ListContentsInterface } from '../interfaces/list-contents.interface';
import { plainToInstance } from 'class-transformer';
import { ContentDto } from '../dtos/content.dto';

@Injectable()
export class ContentService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createDraft(data: CreateDraftInterface, userId: number) {
    const content = await this.db.content.create({
      data: {
        ...data,
        created_by: userId,
        status: Status.DRAFT,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    this.eventEmitter.emit(CONTENT_CRATED_EVENT, content);
  }

  async updateContent(
    data: UpdateContentInterface,
    user: { id: number; role: string },
  ) {
    const content = await this.findContentOrThrow(data.id);
    UserCannotEditGuard(
      content.created_by,
      user.id,
      user.role,
      ErrorMessage.ACTION_IS_NOT_ALLOWED,
    );

    CannotBeEditableGuard(
      content.status,
      Status.DRAFT,
      ErrorMessage.DRAFT_ONLY_EDITABLE,
    );

    const _data = {};
    if (data.title) _data['title'] = data.title;
    if (data.body) _data['body'] = data.body;
    if (data.sector) _data['sector'] = data.sector;

    await this.db.content.update({
      where: { id: data.id },
      data: { ..._data, updated_at: new Date() },
    });

    this.eventEmitter.emit(CONTENT_UPDATED_EVENT, {
      contentId: data.id,
      userId: user.id,
      changes: data,
    });
  }

  async submitForReview(id: number, user: { id: number; role: string }) {
    const content = await this.findContentOrThrow(id);
    UserCannotEditGuard(
      content.created_by,
      user.id,
      user.role,
      ErrorMessage.ACTION_IS_NOT_ALLOWED,
    );

    CannotBeEditableGuard(
      content.status,
      Status.DRAFT,
      ErrorMessage.DRAFT_ONLY_SUBMIT,
    );

    await this.db.content.update({
      where: { id },
      data: { status: Status.IN_REVIEW, updated_at: new Date() },
    });

    this.eventEmitter.emit(CONTENT_STATUS_CHANGED_EVENT, {
      contentId: id,
      from: Status.DRAFT,
      to: Status.IN_REVIEW,
      userId: user.id,
    });
  }

  async approveContent(id: number, userId: number) {
    const content = await this.findContentOrThrow(id);
    CannotBeEditableGuard(
      content.status,
      Status.IN_REVIEW,
      ErrorMessage.IN_REVIEW_ONLY_APPROVE,
    );

    await this.db.content.update({
      where: { id },
      data: { status: Status.PUBLISHED, updated_at: new Date() },
    });

    this.eventEmitter.emit(CONTENT_STATUS_CHANGED_EVENT, {
      contentId: id,
      from: Status.IN_REVIEW,
      to: Status.PUBLISHED,
      userId,
    });
  }

  async listContents(query: ListContentsInterface) {
    const [contents, total] = await Promise.all([
      this.db.content.findMany({
        where: { ...query.filters },
        skip: query.skip,
        take: query.limit,
        orderBy: { created_at: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
        },
      }),
      this.db.content.count({ where: { ...query.filters } }),
    ]);

    return {
      contents: plainToInstance(ContentDto, contents, {
        excludeExtraneousValues: true,
      }),
      total,
    };
  }

  private async findContentOrThrow(id: number) {
    const content = await this.db.content.findUnique({
      where: { id },
    });
    NotFoundGuard(content, ErrorMessage.CONTENT_NOT_FOUND);

    return content;
  }
}
