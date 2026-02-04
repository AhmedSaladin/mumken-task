import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CONTENT_CRATED_EVENT,
  CONTENT_STATUS_CHANGED_EVENT,
} from 'src/common/utils/keys.utils';
import { Status } from 'generated/prisma/client';

describe('ContentService', () => {
  let service: ContentService;
  let database: DatabaseService;
  let mockEventEmitter: any;

  const mockEditor = { id: 1, role: 'EDITOR' } as any;

  const mockReviewer = { id: 2, role: 'REVIEWER' } as any;

  const mockAdmin = { id: 3, role: 'ADMIN' } as any;

  beforeEach(async () => {
    const mockDatabaseService = {
      content: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    database = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDraft', () => {
    it('should create a draft when user is an editor', async () => {
      const createDto = {
        title: 'Test Content',
        body: 'Test body',
        sector: 'Technology',
      };

      const mockContent = {
        id: 1,
        ...createDto,
        status: Status.DRAFT,
        created_by: mockEditor.id,
        created_at: new Date(),
        updated_at: new Date(),
      } as any;

      const mockContentWithAuthor = {
        ...mockContent,
        author: { id: mockEditor.id, name: 'Test Editor' },
      };

      jest.spyOn(database.content, 'create').mockResolvedValue(mockContentWithAuthor as any);

      await service.createDraft(createDto as any, mockEditor.id);

      expect(database.content.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          created_by: mockEditor.id,
          status: Status.DRAFT,
        },
        include: {
          author: { select: { id: true, name: true } },
        },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(CONTENT_CRATED_EVENT, mockContentWithAuthor);
    });

    it('should allow reviewer to create draft', async () => {
      const createDto = {
        title: 'Test Content',
        body: 'Test body',
        sector: 'Technology',
      };

      const mockContent = {
        id: 2,
        ...createDto,
        status: Status.DRAFT,
        created_by: mockReviewer.id,
        created_at: new Date(),
        updated_at: new Date(),
      } as any;

      const mockContentWithAuthor = {
        ...mockContent,
        author: { id: mockReviewer.id, name: 'Reviewer' },
      };

      jest.spyOn(database.content, 'create').mockResolvedValue(mockContentWithAuthor as any);

      await service.createDraft(createDto as any, mockReviewer.id);

      expect(database.content.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(CONTENT_CRATED_EVENT, mockContentWithAuthor);
    });

    it('should allow admin to create draft', async () => {
      const createDto = {
        title: 'Test Content',
        body: 'Test body',
        sector: 'Technology',
      };

      const mockContent = {
        id: 1,
        ...createDto,
        status: Status.DRAFT,
        created_by: mockAdmin.id,
        created_at: new Date(),
        updated_at: new Date(),
      } as any;

      const mockContentWithAuthor = {
        ...mockContent,
        author: { id: mockAdmin.id, name: 'Admin' },
      };

      jest.spyOn(database.content, 'create').mockResolvedValue(mockContentWithAuthor as any);

      await service.createDraft(createDto as any, mockAdmin.id);

      expect(database.content.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(CONTENT_CRATED_EVENT, mockContentWithAuthor);
    });
  });

  describe('approveAndPublish', () => {
    it('should approve content when user is a reviewer', async () => {
      const mockContent = {
        id: 1,
        title: 'Test Content',
        body: 'Test body',
        sector: 'Technology',
        status: Status.IN_REVIEW,
        created_by: mockEditor.id,
        created_at: new Date(),
        updated_at: new Date(),
      } as any;

      const updatedContent = {
        ...mockContent,
        status: Status.PUBLISHED,
        author: { id: mockEditor.id, name: 'Test Editor' },
      } as any;

      jest.spyOn(database.content, 'findUnique').mockResolvedValue(mockContent);
      jest.spyOn(database.content, 'update').mockResolvedValue(updatedContent as any);

      await service.approveContent(mockContent.id, mockReviewer.id);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(CONTENT_STATUS_CHANGED_EVENT, {
        contentId: mockContent.id,
        from: Status.IN_REVIEW,
        to: Status.PUBLISHED,
        userId: mockReviewer.id,
      });
    });

    it('should allow approval regardless of caller role (service-level)', async () => {
      const mockContent = {
        id: 1,
        title: 'Test Content',
        body: 'Test body',
        sector: 'Technology',
        status: Status.IN_REVIEW,
        created_by: mockEditor.id,
        created_at: new Date(),
        updated_at: new Date(),
      } as any;

      const updatedContent = {
        ...mockContent,
        status: Status.PUBLISHED,
        author: { id: mockEditor.id, name: 'Test Editor' },
      } as any;

      jest.spyOn(database.content, 'findUnique').mockResolvedValue(mockContent);
      jest.spyOn(database.content, 'update').mockResolvedValue(updatedContent as any);

      await service.approveContent(mockContent.id, mockEditor.id);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(CONTENT_STATUS_CHANGED_EVENT, {
        contentId: mockContent.id,
        from: Status.IN_REVIEW,
        to: Status.PUBLISHED,
        userId: mockEditor.id,
      });
    });

    it('should throw NotFoundException when content does not exist', async () => {
      jest.spyOn(database.content, 'findUnique').mockResolvedValue(null);

      await expect(service.approveContent(999, mockReviewer.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitForReview', () => {
    it('should submit draft for review', async () => {
      const mockContent = {
        id: 1,
        title: 'Test Content',
        body: 'Test body',
        sector: 'Technology',
        status: Status.DRAFT,
        created_by: mockEditor.id,
        created_at: new Date(),
        updated_at: new Date(),
      } as any;

      const updatedContent = {
        ...mockContent,
        status: Status.IN_REVIEW,
        author: { id: mockEditor.id, name: 'Test Editor' },
      } as any;

      jest.spyOn(database.content, 'findUnique').mockResolvedValue(mockContent);
      jest.spyOn(database.content, 'update').mockResolvedValue(updatedContent as any);

      await service.submitForReview(mockContent.id, mockEditor as any);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(CONTENT_STATUS_CHANGED_EVENT, expect.objectContaining({
        contentId: mockContent.id,
        from: Status.DRAFT,
        to: Status.IN_REVIEW,
        userId: mockEditor.id,
      }));
    });
  });
});
