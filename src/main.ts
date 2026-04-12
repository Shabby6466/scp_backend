/* eslint-disable no-console */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { AppService } from '@modules/main/app.service';
import { HttpExceptionFilter } from '@modules/common/filters/http-exception.filter';
import { TrimStringsPipe } from '@modules/common/transformer/trim-strings.pipe';
import { adminModulesImports, AppModule, imports } from '@modules/main/app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as express from 'express';
import * as path from 'path';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from '@utils/logger/logger.service';
import * as compression from 'compression';
import { DecimalInterceptor } from '@modules/common/interceptors/decimal-interceptor';
import helmet from 'helmet';

const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger: LoggerService = app.get(WINSTON_MODULE_NEST_PROVIDER);

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve locally uploaded files (image uploads for vendor inventory MVP)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.useLogger(logger);
  app.useGlobalInterceptors(new DecimalInterceptor());

  app.useGlobalPipes(new TrimStringsPipe(), new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true
  }));
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.setGlobalPrefix('api');

  app.disable('x-powered-by');
  app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  appSwaggerDoc(app, imports);
  adminSwaggerDoc(app, adminModulesImports);

  app.enableShutdownHooks();

  const port = process.env.APP_PORT || 4000;
  await app.listen(port);
  AppService.startup();
};

const appSwaggerDoc = (app: INestApplication, modules: any[]) => {
  const config = new DocumentBuilder()
    .setTitle('🌐  SCP')
    .setDescription('SCHOOL COMPLIANCE BACKEND APIs')
    .setVersion('1.0')
    .addServer(`http://localhost:${process.env.PORT}`, 'Local')
    .addServer('https://api.nearvendor.pro', 'Live')
    .addBearerAuth()
    .build();
  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    include: modules,
  };

  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Mobile | API Docs',
    customfavIcon: 'https://play-lh.googleusercontent.com/PGfKOUe2eR93IM4P7SpY7YJ0en_RFa92gZWur5VSWnR_qrTNR-7horCIYakEClBkGg=w240-h480-rw',
  });
};

const adminSwaggerDoc = (app: INestApplication, modules: any[]) => {
  const config = new DocumentBuilder()
    .setTitle('🌐 nearvendor')
    .setDescription('Admin Backend APIs')
    .setVersion('1.0')
    .addServer(`http://localhost:${process.env.APP_PORT}`, 'Local')
    .addServer('https://api.nearvendor.pro', 'Live')
    .addBearerAuth()
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    include: modules,
  };

  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('/docs/admin', app, document, {
    customSiteTitle: 'Admin | API Docs',
    customfavIcon: 'https://play-lh.googleusercontent.com/PGfKOUe2eR93IM4P7SpY7YJ0en_RFa92gZWur5VSWnR_qrTNR-7horCIYakEClBkGg=w240-h480-rw',
  });
};

bootstrap()
  .then(() => console.log('Server started on ' + (process.env.APP_PORT || 4000)))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
