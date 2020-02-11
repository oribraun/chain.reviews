import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {

  transform(array: any[], currentField: string): any {
    //orderFields.forEach(function(currentField) {
    var orderType = 'ASC';

    if (currentField[0] === '-') {
      orderType = 'DESC';
    }
    if (currentField[0] === '-' || currentField[0] === '+') {
      currentField = currentField.substring(1);
    }

    if(currentField) {
      array.sort(function (a:any, b:any) {
        let fields = currentField.split(".");
        let aVal = a;
        let bVal = b;
        for(let i in fields) {
          aVal = aVal[fields[i]];
          bVal = bVal[fields[i]];
        }
        let first = aVal.toString().toLowerCase().trim();
        let second = bVal.toString().toLowerCase().trim();
        if(!isNaN(first)) {
          first = parseFloat(first);
        }
        if(!isNaN(second)) {
          second = parseFloat(second);
        }
        if(currentField == 'lastseen') {
          // first = new Date(a[currentField] * 1000);
          // console.log(first)
          // second = new Date(b[currentField] * 1000);
          // console.log(second)
        }
        if (orderType === 'ASC') {
          if (first < second) return -1;
          if (first > second) return 1;
          return 0;
        } else {
          if (first < second) return 1;
          if (first > second) return -1;
          return 0;
        }
      });
    } else {
      array.sort(function (a:any, b:any) {
        let first = a.toLowerCase().trim();
        let second = b.toLowerCase().trim();
        if(!isNaN(first)) {
          first = parseFloat(first);
        }
        if(!isNaN(second)) {
          second = parseFloat(second);
        }
        if (orderType === 'ASC') {
          if (first < second) return -1;
          if (first > second) return 1;
          return 0;
        } else {
          if (first < second) return 1;
          if (first > second) return -1;
          return 0;
        }
      });
    }

    //});
    return array;
  }

}
