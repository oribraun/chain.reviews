import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";

declare var DATA: any;
@Component({
  selector: 'app-richlist',
  templateUrl: './richlist.component.html',
  styleUrls: ['./richlist.component.less']
})
export class RichlistComponent implements OnInit {

  public data;
  public richlistBalance: any = [];
  public richlistReceived: any = [];
  public stats: any;
  public dist: any = {
    a: '',
    b: '',
    c: '',
    d: '',
    e: '',
  };
  public type: string;
  public gettingRichlist: boolean = false;
  public currentType: string = 'balance';

  private http: HttpClient;
  private route: ActivatedRoute;
  constructor(http: HttpClient, route: ActivatedRoute) {
    this.http = http;
    this.route = route;

    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log(data);
    this.data = data;
    this.route.params.subscribe(params => {
      this.type = params['type'];
    });
    this.getRichlist();
  }

  ngOnInit() {
  }

  getRichlist() {
    this.richlistBalance = [];
    this.gettingRichlist = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getRichlist';
    console.log('url', url)
    this.http.get(url).subscribe(
      (data: any) => {
        this.stats = data.stats;
        this.dist.a = data.dista;
        this.dist.b = data.distb;
        this.dist.c = data.distc;
        this.dist.d = data.distd;
        this.dist.e = data.diste;
        this.richlistBalance = data.balance;
        this.richlistReceived = data.received;
        this.gettingRichlist = false;
      },
      (error) => {
        console.log(error);
        this.gettingRichlist = false;
      }
    )
  }

  setCurrentType(type) {
    this.currentType = type;
  }

}
