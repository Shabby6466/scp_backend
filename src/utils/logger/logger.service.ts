import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  log(message: any, ...optionalParams: any[]) {
    // This will be handled by nest-winston if configured in main.ts
    console.log(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    console.error(message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    console.warn(message, ...optionalParams);
  }

  debug?(message: any, ...optionalParams: any[]) {
    console.debug(message, ...optionalParams);
  }

  verbose?(message: any, ...optionalParams: any[]) {
    console.info(message, ...optionalParams);
  }
}
