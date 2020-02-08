import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prettyDaysHoursMinutes'
})
export class PrettyDaysHoursMinutesPipe implements PipeTransform {

  transform(timestamp: any): any {
    var seconds = parseInt(timestamp, 10);
    var days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    var hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return days + " Days, " + hours + " Hours, " + minutes + " Minutes";
  }

}
