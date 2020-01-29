import {Component, OnInit} from '@angular/core';

declare let DATA: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit{
  title = 'explorer';
  // data;

  ngOnInit(): void {
    // let data: any = {}; /// from server node ejs data
    // if (typeof DATA !== "undefined") {
    //   data = DATA;
    // }
    // console.log('session data');
    // console.log(data);
    // this.data = data;
  }
}
