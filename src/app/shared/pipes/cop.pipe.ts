import { Pipe, PipeTransform } from '@angular/core';

import { formatCop } from '../utils/format';

@Pipe({ name: 'cop' })
export class CopPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCop(value ?? 0);
  }
}
