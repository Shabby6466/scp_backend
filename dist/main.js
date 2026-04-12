"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const class_validator_1 = require("class-validator");
const app_service_1 = require("./modules/main/app.service");
const http_exception_filter_1 = require("./modules/common/filters/http-exception.filter");
const trim_strings_pipe_1 = require("./modules/common/transformer/trim-strings.pipe");
const app_module_1 = require("./modules/main/app.module");
const nest_winston_1 = require("nest-winston");
const express = require("express");
const path = require("path");
const swagger_1 = require("@nestjs/swagger");
const compression = require("compression");
const decimal_interceptor_1 = require("./modules/common/interceptors/decimal-interceptor");
const helmet_1 = require("helmet");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = app.get(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER);
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    app.useLogger(logger);
    app.useGlobalInterceptors(new decimal_interceptor_1.DecimalInterceptor());
    app.useGlobalPipes(new trim_strings_pipe_1.TrimStringsPipe(), new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter(logger));
    app.setGlobalPrefix('api');
    app.disable('x-powered-by');
    app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' });
    (0, class_validator_1.useContainer)(app.select(app_module_1.AppModule), { fallbackOnErrors: true });
    appSwaggerDoc(app, app_module_1.imports);
    adminSwaggerDoc(app, app_module_1.adminModulesImports);
    app.enableShutdownHooks();
    const port = process.env.APP_PORT || 4000;
    await app.listen(port);
    app_service_1.AppService.startup();
};
const appSwaggerDoc = (app, modules) => {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('🌐  SCP')
        .setDescription('SCHOOL COMPLIANCE BACKEND APIs')
        .setVersion('1.0')
        .addServer(`http://localhost:${process.env.PORT}`, 'Local')
        .addServer('https://api.nearvendor.pro', 'Live')
        .addBearerAuth()
        .build();
    const options = {
        operationIdFactory: (controllerKey, methodKey) => methodKey,
        include: modules,
    };
    const document = swagger_1.SwaggerModule.createDocument(app, config, options);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        customSiteTitle: 'Mobile | API Docs',
        customfavIcon: 'https://play-lh.googleusercontent.com/PGfKOUe2eR93IM4P7SpY7YJ0en_RFa92gZWur5VSWnR_qrTNR-7horCIYakEClBkGg=w240-h480-rw',
    });
};
const adminSwaggerDoc = (app, modules) => {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('🌐 nearvendor')
        .setDescription('Admin Backend APIs')
        .setVersion('1.0')
        .addServer(`http://localhost:${process.env.APP_PORT}`, 'Local')
        .addServer('https://api.nearvendor.pro', 'Live')
        .addBearerAuth()
        .build();
    const options = {
        operationIdFactory: (controllerKey, methodKey) => methodKey,
        include: modules,
    };
    const document = swagger_1.SwaggerModule.createDocument(app, config, options);
    swagger_1.SwaggerModule.setup('/docs/admin', app, document, {
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
//# sourceMappingURL=main.js.map