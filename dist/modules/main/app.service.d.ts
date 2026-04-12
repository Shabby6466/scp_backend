import { WinstonModuleOptions } from 'nest-winston';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare class AppService {
    constructor();
    static typeormConfig(): TypeOrmModuleOptions;
    static envConfiguration(): string;
    static createWinstonTransports(): WinstonModuleOptions;
    static startup(): void;
    root(): string;
}
