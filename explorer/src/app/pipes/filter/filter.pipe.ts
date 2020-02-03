import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(array: any[], value: string, keys: any): any {
    return array.filter(function(item) {
      if(!value) {
        return true;
      }
      if(typeof keys === 'string') {
        var array = keys.split(',');
        for(var i in array) {
          if(item[array[i]].toString().indexOf(value) > -1) {
            return true;
          }
        }
      } else {
        if(keys && keys.length) {
          for(var i in keys) {
            if(item[keys[i]].toString().indexOf(value) > -1) {
              return true;
            }
          }
        }
      }
      return false;
    });
  }

}
