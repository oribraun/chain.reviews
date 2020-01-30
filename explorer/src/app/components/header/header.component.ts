import { Component, OnInit } from '@angular/core';

declare var DATA: any;
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {

  public data:any;
  constructor() { }

  ngOnInit() {
    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log('session data');
    console.log(data);
    this.data = data;
  }

}
