import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { AppConfig } from '../../entities/app-config.entity';
export declare class SeederService implements OnApplicationBootstrap {
    private readonly userRepository;
    private readonly configRepository;
    private readonly logger;
    constructor(userRepository: Repository<User>, configRepository: Repository<AppConfig>);
    onApplicationBootstrap(): Promise<void>;
    private seedAdmin;
    private seedAppConfig;
}
