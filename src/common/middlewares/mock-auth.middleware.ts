import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MockAuthMiddleware implements NestMiddleware {
  constructor(private db: DatabaseService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Mock authentication - uses x-user-id header for simplicity
    const headerValue = req.headers['x-user-id'];
    const userId = headerValue
      ? parseInt(Array.isArray(headerValue) ? headerValue[0] : headerValue, 10)
      : undefined;

    if (userId) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, name: true },
      });

      if (user) {
        req['user'] = user;
      }
    }

    next();
  }
}
