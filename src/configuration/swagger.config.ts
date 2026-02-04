import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import configuration from './configuration';
import { Environment } from './env.validation';

export const SwaggerConfig = (
  app: INestApplication,
  ops: { apiVersion: string; title: string; description: string },
) => {
  const options = new DocumentBuilder()
    .setTitle(ops.title)
    .addGlobalParameters({
      in: 'header',
      required: true,
      name: 'x-user-id',
      schema: {
        type: 'string',
      },
    })
    .setDescription(ops.description)
    .setVersion(ops.apiVersion)
    .addServer(`http://localhost:${configuration().PORT}/`, 'Local environment')
    .build();

  const document = SwaggerModule.createDocument(app, options);

  if (configuration().NODE_ENV == Environment.Development)
    SwaggerModule.setup(`/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: ops.title,
    });
};
