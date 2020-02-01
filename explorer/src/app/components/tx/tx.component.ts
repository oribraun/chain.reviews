import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";

declare var DATA: any;
@Component({
  selector: 'app-tx',
  templateUrl: './tx.component.html',
  styleUrls: ['./tx.component.less']
})
export class TxComponent implements OnInit {

  public data;
  public tx: any;
  public hash: string;
  public gettingBlock: boolean = false;

  private http: HttpClient;
  private route: ActivatedRoute;
  constructor(http: HttpClient, route: ActivatedRoute) {
    this.http = http;
    this.route = route;
    this.route.params.subscribe(params => {
      this.hash = params['hash'];
    });

    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log(data);
    this.data = data;
    this.getTxDetails();
  }

  ngOnInit() {
  }

  getTxDetails() {
    this.gettingBlock = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getTxDetails/' + this.hash;
    console.log('url', url)
    this.http.get(url).subscribe(
      (tx: any) => {
        this.tx = tx;
        this.gettingBlock = false;
      },
      (error) => {
        console.log(error);
        this.gettingBlock = false;
      }
    )
  }

}
