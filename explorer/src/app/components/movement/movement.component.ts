import {Component, HostListener, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";

declare var DATA: any;
@Component({
  selector: 'app-movement',
  templateUrl: './movement.component.html',
  styleUrls: ['./movement.component.less']
})
export class MovementComponent implements OnInit {

  public data;
  public input = '';
  public txs: [];
  public txVinVoutCount: any = 0;
  public emptyTable: any[] = [];
  public currentTable: any[] = [];
  public gettingTxs = false;
  public gettingTxVinVoutCount = false;
  public pagination: any = {
    current: 1,
    start: 1,
    end: 10,
    pages: 0,
    maxPages: 10,
    offset: 0,
    limit: 10
  }
  public flags = {
    "min_amount": 100,
    "low_flag": 9999999, // flaga
    "high_flag": 10000000 // flagb
  };
  private http: HttpClient;
  constructor(http: HttpClient) {
    this.http = http;
  }

  ngOnInit() {
    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log(data);
    this.data = data;
    this.setCurrentTable();
    this.getTxVinVoutCount();
    this.getTxs();

  }

  setPages() {
    if(window.innerWidth <= 415) {
      this.pagination.maxPages = 5;
    } else {
      this.pagination.maxPages = 10;
    }
    this.pagination.pages = Math.ceil(this.txVinVoutCount / this.pagination.limit);
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
  setCurrentTable() {
    for(var i = 0; i < this.pagination.maxPages; i++) {
      this.emptyTable.push( { "timestamp": "", "total": "", "_id": "", "txid": "&nbsp;" });
    }
    this.currentTable = this.emptyTable.slice();
  }
  nextPage() {
    if(this.gettingTxs) return;
    if(this.pagination.current < this.pagination.pages) {
      this.pagination.current++;
      this.getTxs();
    }
    if(this.pagination.end < this.pagination.pages && this.pagination.current > Math.floor(this.pagination.maxPages / 2)) {
      this.pagination.start++;
      this.pagination.end++;
    }
    this.pagination.offset = (this.pagination.current - 1);
  }

  prevPage() {
    if(this.gettingTxs) return;
    if(this.pagination.current > 1) {
      this.pagination.current--;
      this.getTxs();
    }
    if(this.pagination.start > 1 && this.pagination.current < this.pagination.pages - Math.ceil(this.pagination.maxPages / 2)) {
      this.pagination.start--;
      this.pagination.end--;
    }
    this.pagination.offset = (this.pagination.current - 1);
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
    this.pagination.offset = (parseInt(this.pagination.current) - 1);

    this.setPages();
    this.getTxs();
  }

  getTxVinVoutCount() {
    this.gettingTxVinVoutCount = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getTxVinVoutCountWhereTotal';
    console.log('url', url)
    this.http.get(url).subscribe(
      (response: any) => {
        if(!response.err) {
          this.txVinVoutCount = response.data;
        }
        this.gettingTxVinVoutCount = false;
        this.setPages();
      },
      (error) => {
        console.log(error);
        this.gettingTxVinVoutCount = false;
      }
    )
  }
  getTxs() {
    this.gettingTxs = true;
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getAllTxVinVout/' + this.pagination.limit + '/' + this.pagination.offset;
    console.log('url', url)
    this.http.get(url).subscribe(
      (response: any) => {
        if(!response.err) {
          this.txs = response.data;
          this.currentTable = this.emptyTable.slice();
          for (var i = 0; i < this.txs.length; i++) {
            this.currentTable[i] = this.txs[i];
          }
        }
        this.gettingTxs = false;
      },
      (error) => {
        console.log(error)
        this.gettingTxs = false;
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
