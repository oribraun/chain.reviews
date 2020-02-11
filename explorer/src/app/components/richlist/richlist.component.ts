import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";

declare var DATA: any;
declare var $: any;
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
    total: ''
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
    if (typeof (<any>window).DATA !== "undefined") {
      data = (<any>window).DATA;
    }
    // console.log(data);
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
      (response: any) => {
        if(!response.err) {
          this.stats = response.data.stats;
          this.dist.a = response.data.dista;
          this.dist.b = response.data.distb;
          this.dist.c = response.data.distc;
          this.dist.d = response.data.distd;
          this.dist.e = response.data.diste;
          this.dist.total = response.data.distTotal;
          this.richlistBalance = response.data.balance;
          this.richlistReceived = response.data.received;
          this.gettingRichlist = false;
          setTimeout(() => {
            this.drawChart();
          })
        }
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

  drawChart() {
    var data = [
      ['Top 1-25', parseFloat(this.dist.a.percent)],
      ['Top 26-50', parseFloat(this.dist.b.percent)],
      ['Top 51-75', parseFloat(this.dist.c.percent)],
      ['Top 76-100', parseFloat(this.dist.d.percent)],
      ['101+', parseFloat(this.dist.e.percent)]
    ];
    var pieWealthDist;
    function draw() {
      $('#pieChart').height($('#pieChart').width());
      pieWealthDist = $.jqplot('pieChart', [data],
        {
          // height: $('#pieChart').width(),
          // width: $('#pieChart').width(),
          seriesColors: ["#d9534f", "#5cb85c", "#428bca", "#222", "#CCC"],
          series: [{
            // Make this a pie chart.
            renderer: $.jqplot.PieRenderer,
            rendererOptions: {
              diameter: $('#pieChart').height() - $('#pieChart').height() / 10,
              padding: 0,
              sliceMargin: 4,
              // Put data labels on the pie slices.
              // By default, labels show the percentage of the slice.
              showDataLabels: false,
            }
          }],
          gridPadding: {top: 0, bottom: 0, left: 0, right: 0},
          grid: {borderWidth: 0, shadow: false, backgroundColor: 'transparent',},
          legend: {
            show: false,
            rendererOptions: {
              numberRows: 1,
              border: 'none'
            },
            location: 's'
          }
        }
      )
    }
    draw();
    $(window).resize(function () {
      console.log('resize')
      pieWealthDist.destroy();
      // pieWealthDist.height = $('#pieChart').width();
      // pieWealthDist.width = $('#pieChart').width();
      draw();
    });
  }

}
