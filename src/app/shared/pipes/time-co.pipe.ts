import { Pipe, PipeTransform } from '@angular/core';

import { formatTimeCo } from '../utils/format';

/** Muestra una hora 24h (HH:mm) como hh:mm am/pm. */
@Pipe({ name: 'timeCo' })
export class TimeCoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatTimeCo(value);
  }
}
