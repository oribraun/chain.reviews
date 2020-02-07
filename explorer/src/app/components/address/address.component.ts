import {Component, HostListener, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";

declare var DATA: any;
@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.less']
})
export class AddressComponent implements OnInit {

  public data;
  public txs: any[] = [];
  public emptyTable: any[] = [];
  public currentTable: any[] = [];
  public addressDetails: any;
  public addr: string;
  public gettingTxs: boolean = false;
  public gettingAddressDetails: boolean = false;
  public pagination: any = {
    current: 1,
    start: 1,
    end: 10,
    pages: 0,
    maxPages: 10,
    offset: 0,
    limit: 10
  }
  public input = '';
  private http: HttpClient;
  private route: ActivatedRoute;
  private router: Router;
  constructor(http: HttpClient, route: ActivatedRoute, router: Router) {
    this.http = http;
    this.route = route;
    this.router = router;
    this.route.params.subscribe(params => {
      this.addr = params['address'];
    });

    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log(data);
    this.data = data;
    this.setCurrentTable();
    this.getAddressDetails();
  }

  ngOnInit() {
  }

  setCurrentTable() {
    for(var i = 0; i < this.pagination.maxPages; i++) {
      this.emptyTable.push( {"txid": "&nbsp;","timestamp": "","amount": "","type": "","blockindex": ""});
    }
    this.currentTable = this.emptyTable.slice();
  }
  setPages() {
    if(window.innerWidth <= 415) {
      this.pagination.maxPages = 5;
    } else {
      this.pagination.maxPages = 10;
    }
    this.pagination.pages = Math.ceil(this.addressDetails.count / this.pagination.limit);
    this.pagination.start = this.pagination.current - Math.floor(this.pagination.maxPages / 2) + 1;
    this.pagination.end = this.pagination.current + Math.floor(this.pagination.maxPages / 2);
    if(this.pagination.start < 1) {
      this.pagination.start = 1;
      // this.pagination.current = this.pagination.start;
      this.pagination.end = this.pagination.maxPages;
    }
    if(this.pagination.end > this.pagination.pages) {
      this.pagination.end = this.pagination.pages;
      // this.pagination.current = this.pagination.end;
      this.pagination.start = this.pagination.end - this.pagination.maxPages + 1;
      if(this.pagination.start < 1) {
        this.pagination.start = 1;
      }
    }
    if(this.pagination.current < 1) {
      this.pagination.current = this.pagination.start;
    }
    if(this.pagination.current > this.pagination.end) {
      this.pagination.current = this.pagination.end;
    }
  }
  nextPage() {
    if(this.gettingTxs) return;
    if(this.pagination.current < this.pagination.pages) {
      this.pagination.current++;
      this.getAddressTxList();
    }
    if(this.pagination.end < this.pagination.pages && this.pagination.current > Math.floor(this.pagination.maxPages / 2)) {
      this.pagination.start++;
      this.pagination.end++;
    }
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.maxPages;
  }

  prevPage() {
    if(this.gettingTxs) return;
    if(this.pagination.current > 1) {
      this.pagination.current--;
      this.getAddressTxList();
    }
    if(this.pagination.start > 1 && this.pagination.current < this.pagination.pages - Math.ceil(this.pagination.maxPages / 2)) {
      this.pagination.start--;
      this.pagination.end--;
    }
    this.pagination.offset = (this.pagination.current - 1) * this.pagination.maxPages;
  }

  setPage(page) {
    if(this.gettingTxs) return;
    if(page == this.pagination.current || !page || isNaN(page)) {
      return;
    }
    this.pagination.current = parseInt(page);
    if(this.pagination.current < 1) {
      this.pagination.current = this.pagination.start;
    }
    if(this.pagination.current > this.pagination.pages) {
      this.pagination.current = this.pagination.pages;
    }
    this.pagination.offset = (parseInt(this.pagination.current) - 1) * parseInt(this.pagination.limit);

    this.setPages();
    this.getAddressTxList();
  }

  getAddressTxList() {
    this.gettingTxs = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getAddressTxs/' + this.addr + '/' + this.pagination.limit + '/' + this.pagination.offset;
    console.log('url', url)
    this.http.get(url).subscribe(
      (txs: any) => {
        this.txs = txs;
        this.currentTable = this.emptyTable.slice();
        for(var i = 0; i< this.txs.length; i++) {
          this.currentTable[i] = this.txs[i];
        }
        this.gettingTxs = false;
      },
      (error) => {
        console.log(error);
        this.gettingTxs = false;
      }
    )
  }

  getAddressDetails() {
    this.gettingAddressDetails = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getAddressDetails/' + this.addr;
    console.log('url', url)
    this.http.get(url).subscribe(
      (addressDetails: any) => {
        if(!addressDetails || addressDetails === 'no address found') {
          this.router.navigateByUrl('/');
        } else {
          this.addressDetails = addressDetails;
          this.getAddressTxList();
          this.setPages();
        }
        this.gettingAddressDetails = false;
      },
      (error) => {
        console.log(error);
        this.gettingAddressDetails = false;
      }
    )
  }

  @HostListener('window:resize')
  onWindowResize() {
    //debounce resize, wait for resize to finish before doing stuff
    if(window.innerWidth <= 415) {
      this.pagination.maxPages = 5;
    } else {
      this.pagination.maxPages = 10;
    }
    this.setPages();
  }

}
