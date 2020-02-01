import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {GlobalDataService} from "../../services/global.data.service";

declare var DATA: any;
@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.less']
})
export class BlockComponent implements OnInit {

  public data;
  public block: any;
  public blockTxs: any;
  public hash: string;
  public gettingBlockTxs: boolean = false;

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
    this.getBlock();
  }

  ngOnInit() {
  }

  getBlock() {
    this.gettingBlockTxs = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getBlockTxsByHash/' + this.hash;
    console.log('url', url)
    this.http.get(url).subscribe(
      (data: any) => {
        this.block = data.block;
        this.blockTxs = data.txs;
        console.log('this.blockTxs', this.blockTxs)
        this.gettingBlockTxs = false;
      },
      (error) => {
        console.log(error);
        this.gettingBlockTxs = false;
      }
    )
  }

}
