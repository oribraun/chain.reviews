import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'range'
})
export class RangePipe implements PipeTransform {
  transform(range:any, min : number, max : number, step : number): any {
    range = [];
    for(let i = min; i<= max; i += step) {
      range.push(i);
    }
    return range;
  }

}
