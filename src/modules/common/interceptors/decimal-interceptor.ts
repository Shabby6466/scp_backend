import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.transform(data);
      }),
    );
  }

  private transform(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.transform(item));
    }
    if (data !== null && typeof data === 'object') {
      const transformed: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          // Handle Decimal types or numbers that need specific formatting
          if (typeof value === 'number' && !Number.isInteger(value)) {
            transformed[key] = parseFloat(value.toFixed(2));
          } else {
            transformed[key] = this.transform(value);
          }
        }
      }
      return transformed;
    }
    return data;
  }
}
