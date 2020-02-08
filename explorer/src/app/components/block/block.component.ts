import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";

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
  private router: Router;
  constructor(http: HttpClient, route: ActivatedRoute, router: Router) {
    this.http = http;
    this.route = route;
    this.router = router;
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
      (response: any) => {
        if(!response.err) {
          this.block = response.data.block;
          this.blockTxs = response.data.txs;
          console.log('this.blockTxs', this.blockTxs)
        } else {
          this.router.navigateByUrl('/');
        }
        this.gettingBlockTxs = false;
      },
      (error) => {
        console.log(error);
        this.gettingBlockTxs = false;
      }
    )
  }

}
