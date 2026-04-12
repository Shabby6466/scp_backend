import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimStringsPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    Object.keys(value).forEach((key) => {
      if (typeof value[key] === 'string') {
        value[key] = value[key].trim();
      }
    });

    return value;
  }
}
