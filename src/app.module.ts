import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { MockAuthMiddleware } from './common/middlewares/mock-auth.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ComponentsModule } from './components/components.module';
import { ContentStatusService } from './common/services/content-status.service';
import { LoggerModule } from 'nestjs-pino/LoggerModule';
import { validate } from './configuration/env.validation';
import { ConfigModule } from '@nestjs/config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    LoggerModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    ComponentsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    ContentStatusService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MockAuthMiddleware).forRoutes('*');
  }
}
