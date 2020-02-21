import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";

declare var DATA: any;
@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.less']
})
export class MarketComponent implements OnInit {

  public data;
  public currentSymbol: string = '';
  public market: any;
  public avaliableMarkets: any;
  public gettingAvaliableMarkets: boolean = false;
  public gettingMarket: boolean = false;

  private http: HttpClient;
  private route: ActivatedRoute;
  private router: Router;
  constructor(http: HttpClient, route: ActivatedRoute, router: Router) {
    this.http = http;
    this.route = route;
    this.router = router;
    this.route.params.subscribe(params => {
      this.currentSymbol = params['symbol'];
      if(this.avaliableMarkets) {
        this.getMarket();
      }
    });

    let data: any = {}; /// from server node ejs data
    if (typeof (<any>window).DATA !== "undefined") {
      data = (<any>window).DATA;
    }
    this.data = data;
    this.getAvaliableMarkets();
  }

  ngOnInit() {
  }

  getAvaliableMarkets() {
    this.gettingAvaliableMarkets = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getAvaliableMarkets';
    this.http.get(url).subscribe(
      (response: any) => {
        if(!response.err) {
          this.avaliableMarkets = response.data;
          var symbols = this.avaliableMarkets.map(function(obj) { return obj.symbol});
          var index = symbols.indexOf(this.currentSymbol);
          if(index > -1) {
            this.getMarket();
          } else {
            this.router.navigateByUrl('/market/' + symbols[0]);
          }
        } else {
          this.router.navigateByUrl('/');
        }
        this.gettingAvaliableMarkets = false;
      },
      (error) => {
        console.log(error);
        this.gettingAvaliableMarkets = false;
      }
    )
  }

  getMarket() {
    this.gettingMarket = true;
    this.market = null;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getMarket/' + this.currentSymbol;
    this.http.get(url).subscribe(
      (response: any) => {
        if(!response.err) {
          this.market = response.data;
          console.log('this.market', this.market)
        } else {
          this.router.navigateByUrl('/');
        }
        this.gettingMarket = false;
      },
      (error) => {
        console.log(error);
        this.gettingMarket = false;
      }
    )
  }

  setCurrentTable(symbol) {
    this.router.navigateByUrl('/market/' + symbol);
  }

  fixPrice(price) {
    return parseFloat(price).toFixed(8);
  }

}
