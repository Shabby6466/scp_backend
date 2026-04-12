import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { LoggerService } from '@utils/logger/logger.service';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: LoggerService);
    catch(exception: any, host: ArgumentsHost): void;
}
