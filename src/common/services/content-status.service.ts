import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ContentStatusChangePayload } from '../interfaces/content-status-changed-payload.interface';
import {
  CONTENT_CRATED_EVENT,
  CONTENT_STATUS_CHANGED_EVENT,
  CONTENT_UPDATED_EVENT,
} from '../utils/keys.utils';

@Injectable()
export class ContentStatusService {
  constructor() {}
  private readonly logger = new Logger(ContentStatusService.name);

  @OnEvent(CONTENT_STATUS_CHANGED_EVENT)
  async handleStatusChange(payload: ContentStatusChangePayload) {
    // This runs asynchronously
    this.logger.log(
      `Content ${payload.id || payload.contentId} status changed from ${payload.from} to ${payload.to} by user ${payload.userId}`,
    );

    // Simulate sending notification
    await this.simulateNotification(payload);

    // Prepare analytics data
    await this.prepareAnalytics(payload);
  }

  @OnEvent(CONTENT_CRATED_EVENT)
  async handleContentCreation(payload: ContentStatusChangePayload) {
    console.log('ContentStatusService - handleContentCreation called');
    console.log('Payload:', payload);
    this.logger.log(
      `Content ${payload.id} created with status ${payload.status} by user ${payload.author?.name} (ID: ${payload.author?.id})`,
    );

    // Simulate sending notification
    await this.simulateNotification(payload);
    // Prepare analytics data

    await this.prepareAnalytics(payload);
  }

  @OnEvent(CONTENT_UPDATED_EVENT)
  async handleContentUpdate(payload: ContentStatusChangePayload) {
    this.logger.log(
      `Content ${payload.id} updated by user ${payload.author?.name} (ID: ${payload.author?.id})`,
    );

    // Simulate sending notification
    await this.simulateNotification(payload);
  }

  private async prepareAnalytics(payload: ContentStatusChangePayload) {
    // Prepare data for analytics
    const analyticsData = {
      event: 'content_status_change',
      ...payload,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`Analytics prepared: ${JSON.stringify(analyticsData)}`);

    // In production, you would send this to an analytics service
  }

  private async simulateNotification(payload: ContentStatusChangePayload) {
    // Simulate async operation (e.g., sending email)
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.logger.log(
      `Notification simulated for content ${payload.id || payload.contentId} status change.`,
    );
  }
}
