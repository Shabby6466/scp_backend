import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class TrimStringsPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata): any;
}
