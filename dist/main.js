"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("./app.module.js");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    app.use((0, cookie_parser_1.default)());
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const extraOrigins = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            const allowed = new Set([
                frontendUrl,
                'http://localhost:3000',
                'http://localhost:5173',
                'http://localhost:8080',
                ...extraOrigins,
            ]);
            if (allowed.has(origin)) {
                callback(null, true);
                return;
            }
            if (process.env.NODE_ENV !== 'production' &&
                /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
                callback(null, true);
                return;
            }
            if (process.env.NODE_ENV !== 'production' &&
                /^http:\/\/localhost:\d+$/.test(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const port = process.env.PORT ?? 4000;
    await app.listen(port);
    console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map