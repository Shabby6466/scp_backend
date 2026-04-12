"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const node_env_enum_1 = require("../../utils/enum/node-env.enum");
const typeorm_naming_strategies_1 = require("typeorm-naming-strategies");
const winston = require("winston");
const winston_console_transport_1 = require("winston-console-transport");
let AppService = class AppService {
    constructor() {
    }
    static typeormConfig() {
        return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [__dirname + '/../../entities/*.entity{.ts,.js}'],
            autoLoadEntities: true,
            synchronize: process.env.DB_SYNC === 'true',
            extra: {
                max: 100,
                connectionLimit: 1000,
            },
            logging: false,
            namingStrategy: new typeorm_naming_strategies_1.SnakeNamingStrategy(),
            migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
            migrationsTableName: 'migrations',
            subscribers: [],
        };
    }
    static envConfiguration() {
        switch (process.env.NODE_ENV) {
            case node_env_enum_1.NodeEnv.TEST:
                return `_${node_env_enum_1.NodeEnv.TEST}.env`;
            default:
                return '.env';
        }
    }
    static createWinstonTransports() {
        let options;
        if (process.env.NODE_ENV === node_env_enum_1.NodeEnv.TEST) {
            options = {
                transports: [
                    new winston_console_transport_1.default({
                        level: 'debug',
                        silent: true,
                        format: winston.format.combine(winston.format.timestamp(), winston.format.printf((data) => `${data.timestamp} ${data.level}: ${data.message}`), winston.format.colorize({
                            all: true,
                            colors: { warn: 'yellow' },
                        })),
                    }),
                ],
            };
        }
        else {
            options = {
                transports: [
                    new winston_console_transport_1.default({
                        level: 'debug',
                        format: winston.format.combine(winston.format.timestamp(), winston.format.printf((data) => `${data.timestamp} ${data.level}: ${data.message}`), winston.format.colorize({
                            all: true,
                            colors: { warn: 'yellow' },
                        })),
                    }),
                ],
            };
        }
        return options;
    }
    static startup() {
        try {
            process
                .on('unhandledRejection', (reason) => console.error('Unhandled Rejection at Promise', reason))
                .on('uncaughtException', (err) => {
                console.error(err, 'Uncaught Exception thrown');
                process.exit(1);
            });
            return;
        }
        catch (err) {
            console.log(err);
        }
    }
    root() {
        return process.env.APP_URL;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AppService);
//# sourceMappingURL=app.service.js.map