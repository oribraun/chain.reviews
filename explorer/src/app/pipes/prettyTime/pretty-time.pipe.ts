import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prettyTime'
})
export class PrettyTimePipe implements PipeTransform {

  transform(timestamp: number): any {
    
    return this.format_unixtime(timestamp);
  }

  format_unixtime(unixtime) {
    if(!unixtime) {
      return "";
    }
    var a = new Date(unixtime * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    let hour: any = a.getHours();
    let min: any = a.getMinutes();
    let sec: any = a.getSeconds();
    let suffix = 'th'
    if (date == 1 || date == 21 || date == 31)
      suffix = 'st';
    if (date == 2 || date == 22 || date == 32)
      suffix = 'nd';
    if (date == 3 || date == 23)
      suffix = 'rd';
    if (hour < 10)
      hour = '0' + hour;
    if (min < 10)
      min = '0' + min;
    if (sec < 10)
      sec = '0' + sec;
    var time = date + suffix + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
  }
}
