import { Pipe, PipeTransform } from '@angular/core';

import { formatDateCo } from '../utils/format';

/** Muestra una fecha ISO (YYYY-MM-DD) como dd/mm/aaaa. */
@Pipe({ name: 'dateCo' })
export class DateCoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDateCo(value);
  }
}
