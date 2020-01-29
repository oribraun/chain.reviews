import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";

declare var DATA: any;
@Component({
  selector: 'app-blocks',
  templateUrl: './blocks.component.html',
  styleUrls: ['./blocks.component.less']
})
export class BlocksComponent implements OnInit {

  public data;
  private http: HttpClient;
  constructor(http: HttpClient) {
    this.http = http;
  }

  ngOnInit() {
    let data: any = {}; /// from server node ejs data
    if (typeof DATA !== "undefined") {
      data = DATA;
    }
    console.log('session data');
    console.log(data);
    this.data = data;
    this.data = { "wallet": "fix", "total": 163490 };
    var dummy = [
      {
        "blockindex": 163489,
        "_id": "5e2b0f06701460225bbb6831",
        "blockhash": "c6f736e52dbc47df9bdcc036b7b3257088f6d2c4ef53a87cc578a98a8a25cf84"
      },
      {
        "blockindex": 163488,
        "_id": "5e2b0f06701460225bbb682f",
        "blockhash": "ed5504c05f916f744f458353ad7a414d28fd28d38623d67c7f39449da92f5b14"
      },
      {
        "blockindex": 163487,
        "_id": "5e2b0f06701460225bbb682d",
        "blockhash": "a73abee080fb195e8819e0f2bd76c0a4342f57c95a10e7c25f8ab4b3755a1621"
      },
      {
        "blockindex": 163486,
        "_id": "5e2b0f06d637a22254f8b3c3",
        "blockhash": "074c31ba1d7a61958db2b2f67d21860555c4cdd0e119da7fcf2712c6228596fa"
      },
      {
        "blockindex": 163485,
        "_id": "5e2b0f06701460225bbb682b",
        "blockhash": "9856363f58ecadaaf8afa8aba65292bb27697d91a0f826dff898d306fec5b06b"
      },
      {
        "blockindex": 163484,
        "_id": "5e2b0f06701460225bbb6827",
        "blockhash": "5dc8a84e84698475b9093e892f58161ef78c57d95679a41324dcbdcf665756e5"
      },
      {
        "blockindex": 163483,
        "_id": "5e2b0f06915b36226226170e",
        "blockhash": "22a2b4aa1216ba6637727d947c4fc270f3dc25ab54cb9604e12a8d0aa5f466a7"
      },
      {
        "blockindex": 163482,
        "_id": "5e2b0f0693b7e7224e6988f6",
        "blockhash": "494cf0aaa4c9efa0ec488bafa6678b82a1bc2836a92728262cb9470ee9a5aa10"
      },
      {
        "blockindex": 163481,
        "_id": "5e2b0f06d637a22254f8b3bb",
        "blockhash": "de5017db3e87da56f8d825eb00b2090142889f87c369378696365413ac835efd"
      },
      {
        "blockindex": 163480,
        "_id": "5e2b0f06d637a22254f8b3b9",
        "blockhash": "2422cb3e46ee3d45d36c69a6ac1eaace3ecf0b8a62c9b08c8828183741cef91b"
      }
    ]
    let url = window.location.origin + '/api/db/' + this.data.wallet + '/getAllBlocks/10/0';
    this.http.get(url).subscribe(
      (data) => {
          console.log(data)
      },
    (error) => {
      console.log(error)
      }
    )
  }

}
