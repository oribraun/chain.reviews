import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";

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
  public gettingTx: boolean = false;

  private http: HttpClient;
  private route: ActivatedRoute;
  private router: Router;
  constructor(http: HttpClient, route: ActivatedRoute, router: Router) {
    this.http = http;
    this.route = route;
    this.router = router;
    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log(data);
    this.data = data;
    this.route.params.subscribe(params => {
      this.hash = params['hash'];
      this.getTxDetails();
    });
  }

  ngOnInit() {
  }

  getTxDetails() {
    this.gettingTx = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getTxDetails/' + this.hash;
    console.log('url', url)
    this.http.get(url).subscribe(
      (response: any) => {
        if(!response.err) {
          this.tx = response.data;
        } else {
          this.router.navigateByUrl('/');
        }
        this.gettingTx = false;
      },
      (error) => {
        console.log(error);
        this.gettingTx = false;
      }
    )
  }

}
