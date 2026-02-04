/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './configuration/configuration';
import * as compression from 'compression';
import helmet from 'helmet';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerConfig } from './configuration/swagger.config';
import validationPipeConfig from './configuration/validation-pipe.config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
    forceCloseConnections: true,
  });

  app.use(compression());
  app.use(helmet());
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
  app.useLogger(app.get(Logger));
  SwaggerConfig(app, {
    apiVersion: '1.0',
    title: 'Qitae API',
    description: 'Qitae Documentation',
  });

  app.enableShutdownHooks();
  await app.listen(configuration().PORT, () =>
    console.log(`Server is running...`),
  );
}

bootstrap();
