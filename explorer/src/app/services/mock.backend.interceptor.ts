import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

// array in local storage for registered users
let blocks = [
  {
    "timestamp": 1579549769,
    "blockindex": 163489,
    "_id": "5e2b0f06701460225bbb6831",
    "blockhash": "c6f736e52dbc47df9bdcc036b7b3257088f6d2c4ef53a87cc578a98a8a25cf84"
  },
  {
    "timestamp": 1579549637,
    "blockindex": 163488,
    "_id": "5e2b0f06701460225bbb682f",
    "blockhash": "ed5504c05f916f744f458353ad7a414d28fd28d38623d67c7f39449da92f5b14"
  },
  {
    "timestamp": 1579549576,
    "blockindex": 163487,
    "_id": "5e2b0f06701460225bbb682d",
    "blockhash": "a73abee080fb195e8819e0f2bd76c0a4342f57c95a10e7c25f8ab4b3755a1621"
  },
  {
    "timestamp": 1579549414,
    "blockindex": 163486,
    "_id": "5e2b0f06d637a22254f8b3c3",
    "blockhash": "074c31ba1d7a61958db2b2f67d21860555c4cdd0e119da7fcf2712c6228596fa"
  },
  {
    "timestamp": 1579549340,
    "blockindex": 163485,
    "_id": "5e2b0f06701460225bbb682b",
    "blockhash": "9856363f58ecadaaf8afa8aba65292bb27697d91a0f826dff898d306fec5b06b"
  },
  {
    "timestamp": 1579549170,
    "blockindex": 163484,
    "_id": "5e2b0f06701460225bbb6827",
    "blockhash": "5dc8a84e84698475b9093e892f58161ef78c57d95679a41324dcbdcf665756e5"
  },
  {
    "timestamp": 1579549023,
    "blockindex": 163483,
    "_id": "5e2b0f06915b36226226170e",
    "blockhash": "22a2b4aa1216ba6637727d947c4fc270f3dc25ab54cb9604e12a8d0aa5f466a7"
  },
  {
    "timestamp": 1579548879,
    "blockindex": 163482,
    "_id": "5e2b0f0693b7e7224e6988f6",
    "blockhash": "494cf0aaa4c9efa0ec488bafa6678b82a1bc2836a92728262cb9470ee9a5aa10"
  },
  {
    "timestamp": 1579548674,
    "blockindex": 163481,
    "_id": "5e2b0f06d637a22254f8b3bb",
    "blockhash": "de5017db3e87da56f8d825eb00b2090142889f87c369378696365413ac835efd"
  },
  {
    "timestamp": 1579548644,
    "blockindex": 163480,
    "_id": "5e2b0f06d637a22254f8b3b9",
    "blockhash": "2422cb3e46ee3d45d36c69a6ac1eaace3ecf0b8a62c9b08c8828183741cef91b"
  }
];

let block = {
  "block": {
    "hash": "c6f736e52dbc47df9bdcc036b7b3257088f6d2c4ef53a87cc578a98a8a25cf84",
    "confirmations": 1,
    "size": 540,
    "height": 163489,
    "version": 5,
    "merkleroot": "4d4d34e6c5939717aa2d7cdc7768b692972701c0947de286f63984c6340e949c",
    "acc_checkpoint": "0000000000000000000000000000000000000000000000000000000000000000",
    "tx": [
      "7a8964a2a32e2981ba4bd7c1aa0cd5ec11988b69f90eec91a1666f22cb7d351a",
      "dc7b77ef9cd7f7c19c7954d0d244e0ee425e8390d8c660a31612d8a27bbc2531"
    ],
    "time": 1579549769,
    "mediantime": 1579549170,
    "nonce": 0,
    "bits": "1a0235c7",
    "difficulty": 7591151.903561886,
    "chainwork": "0000000000000000000000000000000000000000000000817dae1c805033afda",
    "previousblockhash": "ed5504c05f916f744f458353ad7a414d28fd28d38623d67c7f39449da92f5b14",
    "moneysupply": 2684077532.3360767,
    "zFIXsupply": {
      "1": 0,
      "5": 0,
      "10": 0,
      "50": 0,
      "100": 0,
      "500": 0,
      "1000": 0,
      "5000": 0,
      "total": 0
    }
  },
  "txs": [
    {
      "_id": "dc7b77ef9cd7f7c19c7954d0d244e0ee425e8390d8c660a31612d8a27bbc2531",
      "totalAmount": 1522070000000,
      "vout": [
        {
          "addresses": "FNVHrGmxhcZErDBHHCxquR7CaUoiXjXm2D",
          "amount": 152207000000
        },
        {
          "addresses": "FTeFZrkW7566pdQkoYXvyfTDWButrZFc7r",
          "amount": 1217656000000
        },
        {
          "addresses": "FCoB1M2CxxN1fAezRAZC31AWtMBZ3zSvyF",
          "amount": 152207000000
        }
      ],
      "vin": [],
      "timestamp": 1579549769,
      "blockindex": 163489,
      "txid": "dc7b77ef9cd7f7c19c7954d0d244e0ee425e8390d8c660a31612d8a27bbc2531",
      "blockhash": null
    },
    {
      "_id": "7a8964a2a32e2981ba4bd7c1aa0cd5ec11988b69f90eec91a1666f22cb7d351a",
      "totalAmount": 0,
      "vout": [],
      "vin": [
        {
          "addresses": "coinbase",
          "amount": 0
        }
      ],
      "timestamp": 1579549769,
      "blockindex": 163489,
      "txid": "7a8964a2a32e2981ba4bd7c1aa0cd5ec11988b69f90eec91a1666f22cb7d351a",
      "blockhash": null
    }
  ]
}
let tx = {
  "hex": "01000000011c0419938ba7722a3f76deda9bc316f593fc61e1c273bf3eab42ff5a468e74ec0100000049483045022100aaba25c91f10a36f41802e850e1e8a53a81aa67d14a46fa6286acce6410169a60220518dd17b67481a65d056c47eded1060a73f6b3dcb58a37abd01c2d3fd245939201ffffffff05000000000000000000802f4aaa50010000232103d5f751fb7deec420c0002bfa3084dd09b830a49f934f57951653077f80b7acbdac00e226b811000000232103d5f751fb7deec420c0002bfa3084dd09b830a49f934f57951653077f80b7acbdac000ef4811b0100001976a914ef44f4f7b397e285cafd4d6f00c9b7318413cbe588acc0813e70230000001976a9144c6b01c032a334b612dcf2f5d7b222e5630afa0988ac00000000",
  "txid": "dc7b77ef9cd7f7c19c7954d0d244e0ee425e8390d8c660a31612d8a27bbc2531",
  "version": 1,
  "locktime": 0,
  "vin": [],
  "vout": [
    {
      "addresses": "FNVHrGmxhcZErDBHHCxquR7CaUoiXjXm2D",
      "amount": 152207000000
    },
    {
      "addresses": "FTeFZrkW7566pdQkoYXvyfTDWButrZFc7r",
      "amount": 1217656000000
    },
    {
      "addresses": "FCoB1M2CxxN1fAezRAZC31AWtMBZ3zSvyF",
      "amount": 152207000000
    }
  ],
  "blockhash": "c6f736e52dbc47df9bdcc036b7b3257088f6d2c4ef53a87cc578a98a8a25cf84",
  "confirmations": 1,
  "time": 1579549769,
  "blocktime": 1579549769,
  "height": 163489
}
let addressTxs = [
  {
    "txid": "dc7b77ef9cd7f7c19c7954d0d244e0ee425e8390d8c660a31612d8a27bbc2531",
    "timestamp": "1579549769",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163489
  },
  {
    "txid": "a13d0561fe42512ca50f818f5c257b82f6f3469d8ebf70855740e46e67538e31",
    "timestamp": "1579549637",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163488
  },
  {
    "txid": "84838f5d38c60b3642ee46e13ac0b10994290481bc987bc2cf9a2dce66132f89",
    "timestamp": "1579549576",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163487
  },
  {
    "txid": "669274df874ae801d100847ab715acae122f7649e1ccade59e2b883c225df33c",
    "timestamp": "1579549414",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163486
  },
  {
    "txid": "06faef05c656ac0b8dd93fc63d99b163a0ea6450906fcd8be2455a1ce363dfc6",
    "timestamp": "1579549340",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163485
  },
  {
    "txid": "66498e8e36587cd770a0276e38df3149359de5ed623e6aec95a769eb5b8f46f4",
    "timestamp": "1579549170",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163484
  },
  {
    "txid": "33f6c11d8d7e964c3600033ed9b3cd15fe4c0947913ec166d5f20089f1242a26",
    "timestamp": "1579549023",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163483
  },
  {
    "txid": "0c52175662e6fb45b9e08281a28eb7dd42ec76ff3876f4a83f6693856d4d4437",
    "timestamp": "1579548879",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163482
  },
  {
    "txid": "fa204b4e38a2d597e08d475b4d4cc5e4204c74be8d0132262e516ec1909b9514",
    "timestamp": "1579548674",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163481
  },
  {
    "txid": "a44aeb4b6a946cb2a87a3176e139a9a5ede687151e8eeafc45c4590e0041d6c2",
    "timestamp": "1579548644",
    "amount": 152207000000,
    "type": "vout",
    "blockindex": 163480
  }
]
let addressDetails = {
  "_id": "FCoB1M2CxxN1fAezRAZC31AWtMBZ3zSvyF",
  "address": "FCoB1M2CxxN1fAezRAZC31AWtMBZ3zSvyF",
  "amount": 135369762037461200,
  "count": 164409
};
var richlist = {
  "active": "richlist",
  "balance": [
    {
      "balance": "10394520544000000.00000000",
      "address": "F6gxS14zxNywQxWjRLvDSPmMU7WQsxbe9t"
    },
    {
      "balance": "10362861488000000.00000000",
      "address": "FQjYUCUpgLks3bHSfts4bViK58dpWoCh7e"
    },
    {
      "balance": "10310502280000000.00000000",
      "address": "FDyNHPSS66VApfCpxBuviFMCvPi9xyPuXF"
    },
    {
      "balance": "8633789868000000.00000000",
      "address": "FCoB1M2CxxN1fAezRAZC31AWtMBZ3zSvyF"
    },
    {
      "balance": "2109132419000000.00000000",
      "address": "F6r7pczBURQSQPN17wZMwAR2aCzsmTpWzC"
    },
    {
      "balance": "2107914763000000.00000000",
      "address": "F9u675ayHGZASbJoUcvFkiMWF1RP2kFDYH"
    },
    {
      "balance": "2087214611000000.00000000",
      "address": "FMytDoDegRksvtDeXSsVcoKmCMqAbuqfjT"
    },
    {
      "balance": "2081126331000000.00000000",
      "address": "FRbigj1RM5xKrhGXewx6nWLK5nqURH9oVH"
    },
    {
      "balance": "2058751902000000.00000000",
      "address": "F9tDvL93YDyQPba5Zpwf748sLTCjQFTYVH"
    },
    {
      "balance": "2007305936000000.00000000",
      "address": "FUo5jsegQE53Nnm1e5knW3gFvqsNotSwbC"
    },
    {
      "balance": "2006240487000000.00000000",
      "address": "F7ChkLpwctDbmMVX9JnQCSmtaUt4NynUvo"
    },
    {
      "balance": "2001217656000000.00000000",
      "address": "FUVEQ843y6vNrji6r1tHaUYSDJZeuR545E"
    },
    {
      "balance": "2001217656000000.00000000",
      "address": "FRC1d8v2sD1iakiQkFPGyevn64Z3DZJdGg"
    },
    {
      "balance": "1499999999666965.00000000",
      "address": "FUcJe5AAGenbNb4za1AkS5WUhWx2ovC2Wq"
    },
    {
      "balance": "1238586499400792.00000000",
      "address": "F9yD13iFenTYtasQyfDwYKaVJN24zDUQaC"
    },
    {
      "balance": "1060730678496776.00000000",
      "address": "FDHjxUVUhV4nwqYsS3zqQyQKRB2hADxTbm"
    },
    {
      "balance": "992535736000000.00000000",
      "address": "FRDYu2c2VnGN4whSruHcDpBgSp5WjUgQxA"
    },
    {
      "balance": "870937374045136.00000000",
      "address": "FMAyq2MuzuwBKE7RpXdBKSxfvAf2qoR5jW"
    },
    {
      "balance": "800000000000000.00000000",
      "address": "FEzUo2Y615ENrmZx27sDRywFkaA2GdCXcp"
    },
    {
      "balance": "725152207000000.00000000",
      "address": "FGvH61e6FtvbYUbaq8S9sfu9dNSigACTqs"
    },
    {
      "balance": "725000000000000.00000000",
      "address": "FApZ2WyrdxKoFiFoo8LHYT6tbvwn4hG4As"
    },
    {
      "balance": "652300000000000.00000000",
      "address": "FV7RYKdP7H2216oVc8374LrrhL51BgDy4e"
    },
    {
      "balance": "564383561000000.00000000",
      "address": "FCTDCwdxgxrz58pZZujBSgRYtn3tV34En3"
    },
    {
      "balance": "557229832000000.00000000",
      "address": "F8PH8Kj8QdmqbHkQE2P6eWpxzH5H1FNAzj"
    },
    {
      "balance": "555859969000000.00000000",
      "address": "FJFMJwFkgwd6Dq8184tRY53KgRmWTEE5Hx"
    },
    {
      "balance": "554185692000000.00000000",
      "address": "FR8A3Zqvt4D8iMgKheFUhuLiePWXhfzbL2"
    },
    {
      "balance": "553576864000000.00000000",
      "address": "FR7NPw4958Lh9j8nkfyzho4yeCTBEKafBg"
    },
    {
      "balance": "549619482000000.00000000",
      "address": "FTDZHqp2JD1E6c7rcVTej8JG7wQ3Ng4gSb"
    },
    {
      "balance": "549619482000000.00000000",
      "address": "FJ7s8g5MUE2SDDkcxyVbYzGj8o92dAs3Ju"
    },
    {
      "balance": "549467275000000.00000000",
      "address": "F88MTiJzmpM5SpgXHEcnrR66cpJn1DkmtM"
    },
    {
      "balance": "549162861000000.00000000",
      "address": "FMTSSpVF521XqfQSVrPjz7yqS3mMxhhiac"
    },
    {
      "balance": "548401826000000.00000000",
      "address": "FAqbKfERiUT5y621N6M7KSjezEqbC2GAtK"
    },
    {
      "balance": "548097412000000.00000000",
      "address": "FQMiw1J7PUgFyz5FqeUoayTNTsPDcor99h"
    },
    {
      "balance": "545814307000000.00000000",
      "address": "FPrBFhZcrDDP7vKM3egnTqF9hFGRUN4W3u"
    },
    {
      "balance": "543835616000000.00000000",
      "address": "FUmbkvvZh2M8ncdDCJoqRbiDZwHAobkH6i"
    },
    {
      "balance": "541856925000000.00000000",
      "address": "FNsezTvmF8z6oPUGAoaWLdueQDysfu6tkB"
    },
    {
      "balance": "541248097000000.00000000",
      "address": "FUHCp9pda4g7u2tAmUfAH9rRN2sHzcP8C9"
    },
    {
      "balance": "541209696000000.00000000",
      "address": "FGTYHW2TaqjMz3LxZPNsUHLzWW2byhGTdo"
    },
    {
      "balance": "539117199000000.00000000",
      "address": "FHQuHR5jdUVqsxFjNdpcufnQmA75zvu3M5"
    },
    {
      "balance": "537747336000000.00000000",
      "address": "FPec21o9mWeMp6ZUxHiwtiiK7xSJhPic9y"
    },
    {
      "balance": "536834094000000.00000000",
      "address": "FRpAfX9YWuQzX2YiGYnwieiAqtVRardqZc"
    },
    {
      "balance": "535312024000000.00000000",
      "address": "FKFgMt1WvAXxfXFTn1ut1WFs8AQGJ8RyJA"
    },
    {
      "balance": "527397260000000.00000000",
      "address": "F6rcKQoz1cAXAAayWogZibU5kZp4WAbw3v"
    },
    {
      "balance": "526788432000000.00000000",
      "address": "FHXUsJdEXU4ewVKHfUkx61bSqMxV29eSks"
    },
    {
      "balance": "525570776000000.00000000",
      "address": "FK9kxvWf2TQRMJ4KeKyFXecNrG3opYrDgp"
    },
    {
      "balance": "517047184000000.00000000",
      "address": "FK2GJPRNbPqNquWZG6UgRHQi8RG8QSAqat"
    },
    {
      "balance": "517047184000000.00000000",
      "address": "F7YUGMKh3YypJQaR6J6EjXXJQ3v1eYEMnX"
    },
    {
      "balance": "515829528000000.00000000",
      "address": "F94bzwUv39RAKTXEVnQJfwjVdxaFKRzJAX"
    },
    {
      "balance": "514919182000000.00000000",
      "address": "FGPGGGNLFaVtoWtT23Bvb3AYRdDWi39GkJ"
    },
    {
      "balance": "514611872000000.00000000",
      "address": "FFAQmwZXrqAoZCJke1BuLgcbqK6qg5oW5T"
    },
    {
      "balance": "514611872000000.00000000",
      "address": "F99jrj7fWbknMH3uAy9TRMj7cWzMtKuoz8"
    },
    {
      "balance": "514611872000000.00000000",
      "address": "FTeFZrkW7566pdQkoYXvyfTDWButrZFc7r"
    },
    {
      "balance": "514611872000000.00000000",
      "address": "FSQj2KgAdbUciizwJwF952LevYWpd6wEiD"
    },
    {
      "balance": "513394216000000.00000000",
      "address": "F8yBQL1u8b5mFKvnuaiJv4pH9hukVURANt"
    },
    {
      "balance": "512633181000000.00000000",
      "address": "FFUu2v8DQd6PKqjzAooyV3QEkyRs4Sgdc2"
    },
    {
      "balance": "512328767000000.00000000",
      "address": "FKGkpRriCcAZvafRJkNGeD61mauapeZ8Mo"
    },
    {
      "balance": "512176560000000.00000000",
      "address": "FSpFRcAmJCxtyGtPjJqXzXdKpiqZoJGGCG"
    },
    {
      "balance": "512176560000000.00000000",
      "address": "FQ3E3nUujYGzf4pLrwW52A1vHS4foZKeD4"
    },
    {
      "balance": "511263318000000.00000000",
      "address": "FSrodwQ8gW5feMytC6t3e8LHcjydMiimv8"
    },
    {
      "balance": "511111111000000.00000000",
      "address": "FJnV4YvLhtXYnDFdzEp5xet2z1EB1ZicTd"
    },
    {
      "balance": "511111111000000.00000000",
      "address": "FMTwJtRsYppykLBWeF2UfAdZ5ATvMpUa32"
    },
    {
      "balance": "509741248000000.00000000",
      "address": "F695gMRbYAWHy5zv6ethtKZL8i5DGxQGM3"
    },
    {
      "balance": "509741247902499.00000000",
      "address": "FB9wMLLU1RtCSHbkr5cZZwddnvvTtZDnFr"
    },
    {
      "balance": "508675799000000.00000000",
      "address": "FLn1fzv5cEFt3vknGbMSKY1ekqn5oLEuAw"
    },
    {
      "balance": "508523592000000.00000000",
      "address": "FKFAqLcrLiXt76iG674txhCUSRQjH57yUY"
    },
    {
      "balance": "508523592000000.00000000",
      "address": "FTirXR94WGFHj84E2hpskStreL7Dez9iCe"
    },
    {
      "balance": "507305936000000.00000000",
      "address": "FDv8Uwxtw9yt7FQTyCtZ4GvX73uCY18YqK"
    },
    {
      "balance": "507305936000000.00000000",
      "address": "FFpjnsWy8aBp46dUxULeV8MCjSxWMTqxQv"
    },
    {
      "balance": "506240487000000.00000000",
      "address": "FGwMLiDsjoCUpKXUx4qqz6rSduZwhes5vw"
    },
    {
      "balance": "506088280000000.00000000",
      "address": "FJ9LTjoLQS1pVSmHyGdAunBzexGpfpXUM1"
    },
    {
      "balance": "506088280000000.00000000",
      "address": "FNMGER4TAFcm8tH5LxkCrKwZ4QqiExSYGd"
    },
    {
      "balance": "506088280000000.00000000",
      "address": "FRWnYucrtEJMPWKaWddBeRhTpSWv43pDrL"
    },
    {
      "balance": "506088280000000.00000000",
      "address": "FPwQ1rKJRbajqPyA7tki1fpaR8JdVr5LeU"
    },
    {
      "balance": "504870624000000.00000000",
      "address": "FRqCnWTSjZNMw1sjxNQbdJgeei2WxW6KJW"
    },
    {
      "balance": "503652968000000.00000000",
      "address": "FMVFBJT6zFBpMW8g3N8C3djCMzExMT6ioz"
    },
    {
      "balance": "503652968000000.00000000",
      "address": "FRCkwTVKVfvvYm6BJCUfKseCFZKEgqyRwX"
    },
    {
      "balance": "502435312000000.00000000",
      "address": "FGwnMAoSNfyusDdWefW85xWcoHaPCofv3g"
    },
    {
      "balance": "502435312000000.00000000",
      "address": "F8wHakXLrmQC15TMZr3GTGLRDj5jTRbw9m"
    },
    {
      "balance": "502435312000000.00000000",
      "address": "FL97i3Z2LzuksY4M3ASbYMCH66Ec2hmAC1"
    },
    {
      "balance": "502435312000000.00000000",
      "address": "FLgF7ibzvWoLG5tcXyis547X7qUDngJvHk"
    },
    {
      "balance": "502435312000000.00000000",
      "address": "FM3ycL2wF6zva3Uf7MaG7E3EpET7Th1W2q"
    },
    {
      "balance": "502435312000000.00000000",
      "address": "FNFNdPXGX7SFQk958VfqDaZSnsk14ChWWo"
    },
    {
      "balance": "502435312000000.00000000",
      "address": "FHy15M9xeTtzG4QXmu4MvsazAArjAJ9DQZ"
    },
    {
      "balance": "501217656000000.00000000",
      "address": "FDZETSLJSv1gT48LPjAqeWCXPaFzz9rigR"
    },
    {
      "balance": "501217656000000.00000000",
      "address": "FTPn2zCujHibeBjZSDiE18hNL87Ji9EkXW"
    },
    {
      "balance": "501217656000000.00000000",
      "address": "FKMXVox3XxsqkRARVJgsJHb1rRAj2TK2U6"
    },
    {
      "balance": "501217656000000.00000000",
      "address": "FKDxJK1cLP9npehxw27fJ1Pi4ijWHAZqGb"
    },
    {
      "balance": "501217656000000.00000000",
      "address": "F8aeXJrbSTDoavP5mHN7qnq6Wz4soKE3zP"
    },
    {
      "balance": "501217656000000.00000000",
      "address": "FMaYr7zCQDt9W6UguvsvedS2u1zz2F2RGz"
    },
    {
      "balance": "501217656000000.00000000",
      "address": "FJ7w5K6SNiDXqHqGgPu79fR9fDxDDyMXUM"
    },
    {
      "balance": "500000000000000.00000000",
      "address": "F9VpErgGzGkLgjdDdFhdgKD473ppAVVqMu"
    },
    {
      "balance": "500000000000000.00000000",
      "address": "FPuCCPfSpcNWpAQG3tTDpVeU9bi8M6BHAD"
    },
    {
      "balance": "500000000000000.00000000",
      "address": "FNzXxuup92Hic4roqdEEh426bGaBxVz2g3"
    },
    {
      "balance": "500000000000000.00000000",
      "address": "F9SVqr5UpHTHdfMtTGEgM9YQ9MW9Y8aZBx"
    },
    {
      "balance": "500000000000000.00000000",
      "address": "F8ZwPipAJQBVmsSUG7E3RVzdANLyMPDe5e"
    },
    {
      "balance": "500000000000000.00000000",
      "address": "FEtmGmdgBz2BkX64d8GfFjH5T8hNySpU4b"
    },
    {
      "balance": "479457251000000.00000000",
      "address": "FNVHrGmxhcZErDBHHCxquR7CaUoiXjXm2D"
    },
    {
      "balance": "428500761000000.00000000",
      "address": "FRtXjJTqvzkYRPA7GEuZwvkPW3Qpk72KxW"
    },
    {
      "balance": "425266359000000.00000000",
      "address": "FLneSQgkQA7t1yF3WdoMwwMJykK49CHfjV"
    },
    {
      "balance": "422247616000000.00000000",
      "address": "FFFSdXnHtwcmsWPTLt2AeFGK5aPR5vAutf"
    }
  ],
  "received": [
    {
      "received": "149860919696919904.00000000",
      "address": "FNeSaXTFTqZByN41vvXMSM7djvRALX5rwn"
    },
    {
      "received": "106315987444568768.00000000",
      "address": "FAoCBtqn1CfqSW7Wx8kg53egUAcxkckBLq"
    },
    {
      "received": "72001775952730600.00000000",
      "address": "FCoB1M2CxxN1fAezRAZC31AWtMBZ3zSvyF"
    },
    {
      "received": "50000000000000000.00000000",
      "address": "FFRCncAYX4VrZhGq341QB7ryyNuPd88DSa"
    },
    {
      "received": "49899999999980800.00000000",
      "address": "FFuMWJNvx95SWthn1WWNKdQfFqV26CwKfs"
    },
    {
      "received": "49799999999935600.00000000",
      "address": "F9obADdzKoEn1SZMYUMN8EomhsYrJL9k5D"
    },
    {
      "received": "49699999999912992.00000000",
      "address": "FN5n82ezWCSkf9pXEQXnyxq2eSTvhZ4TM5"
    },
    {
      "received": "49599999999890496.00000000",
      "address": "FEq4HDfSNQADWTrTzpx2cdvUtsafeC7xFq"
    },
    {
      "received": "49499999999867992.00000000",
      "address": "F9Ghvzj7hdmZtYtFBEVU2vENt9W1sahThb"
    },
    {
      "received": "49399999999845400.00000000",
      "address": "FHZseSZvCFMBcWiXeuWZ7XQ8mNLy1PodFy"
    },
    {
      "received": "49299999999822792.00000000",
      "address": "FCi4WDdtRLLptNfrE28xmAgS8UfnDnKPa7"
    },
    {
      "received": "49199999999800192.00000000",
      "address": "FHXnrPAv441pkUbFsYhx2EGraFGYD3zyac"
    },
    {
      "received": "49099999999777600.00000000",
      "address": "FCG6niS3LGYSRK3cN4TyY4oVk83hqm3dEc"
    },
    {
      "received": "48999999999754992.00000000",
      "address": "FEWsf56B9PUrhm6UDwnG6uWG4T35j29Z9u"
    },
    {
      "received": "48899999999732392.00000000",
      "address": "F77bcBocHnozQHbmS7Rh9ZUwwkYGhX5xHE"
    },
    {
      "received": "32000000000000000.00000000",
      "address": "FEzUo2Y615ENrmZx27sDRywFkaA2GdCXcp"
    },
    {
      "received": "20857382194069288.00000000",
      "address": "F7TVsiEr1io5aXxujPwhSxaR5GmyogJ1ET"
    },
    {
      "received": "10996983460459558.00000000",
      "address": "FU6Y8y3NjTmVfmDxk56XnNtmZZRS7W7UXK"
    },
    {
      "received": "10398173512000000.00000000",
      "address": "F6gxS14zxNywQxWjRLvDSPmMU7WQsxbe9t"
    },
    {
      "received": "10368949768000000.00000000",
      "address": "FQjYUCUpgLks3bHSfts4bViK58dpWoCh7e"
    },
    {
      "received": "10317808216000000.00000000",
      "address": "FDyNHPSS66VApfCpxBuviFMCvPi9xyPuXF"
    },
    {
      "received": "9032204069363128.00000000",
      "address": "FA1c2DvQqEsLwD48w9vibJPtNWCCiw8jBF"
    },
    {
      "received": "8799920198311062.00000000",
      "address": "FFKN9dVZzVqY8nFQeqkQ5LDuGtZSJhVmSF"
    },
    {
      "received": "8699920198288471.00000000",
      "address": "FQ6dqrKP5P7BSkVpdMA4WKyVYo3KzkeTSR"
    },
    {
      "received": "6702740137259334.00000000",
      "address": "FJsn59yqmRfDRo3M8RH5JgKc9LgxPLmcts"
    },
    {
      "received": "6602740137259334.00000000",
      "address": "FF94wSetvfzJR2hx6MfTNnprnYzmnpvRYe"
    },
    {
      "received": "6502740137236734.00000000",
      "address": "FRbCER5MHH8jYuVB96zXrHAj8yUNBAMDTd"
    },
    {
      "received": "6499999999681937.00000000",
      "address": "FQF5wj8vHwhtubReqRmtoApgRfJXNrXkVG"
    },
    {
      "received": "6402740137214234.00000000",
      "address": "FCB4dDT2YX5kh8yqQuQpxEaa5uqJAKei1i"
    },
    {
      "received": "6302740137191634.00000000",
      "address": "FNnw2Sx7Ar3bSx9JQKx8srwecJfJx4gfJX"
    },
    {
      "received": "6202740137169034.00000000",
      "address": "FFN3aip3bwsq2dZuVRZs2uwvF87PBFyZNt"
    },
    {
      "received": "6102740137146434.00000000",
      "address": "F5tkM13Qd2r9eiHFfQ9L3FXrnfPM4EgjvQ"
    },
    {
      "received": "6021873359592780.00000000",
      "address": "FE4JbNCdHBTgr9wLpBvnVGR8LUjDS56e6M"
    },
    {
      "received": "6002740137123834.00000000",
      "address": "FRzL49qH6SeTQLasYyEDrnEhuJX5WCbDTN"
    },
    {
      "received": "5902740137101234.00000000",
      "address": "FGHj1nbG9oacGfwYHxagoApL5hMwETzwvo"
    },
    {
      "received": "5802740137078634.00000000",
      "address": "FEVZAVkGqCTjEGNZ6Upfy4EEPu4okd92Vb"
    },
    {
      "received": "5795738194367975.00000000",
      "address": "F8d8VVJ7MKj1SzAkxzCyDR59kSCiKQWH9s"
    },
    {
      "received": "5702740137056034.00000000",
      "address": "F6pRyL5N8GDBge5EaS47XWunNfSifsidXi"
    },
    {
      "received": "5695738194345375.00000000",
      "address": "FDm8xL8huGyT7TnM5HE1Hk8Su6AvJZfmmr"
    },
    {
      "received": "5602740137033434.00000000",
      "address": "FF9TDAZPnrn97UPW387ptZCK2N2CKinA5P"
    },
    {
      "received": "5595738194322775.00000000",
      "address": "FSAFPHZ4nocsFSuszTsVYGi3NcaJmKnDu9"
    },
    {
      "received": "5502740137010834.00000000",
      "address": "FJCNZgdG41UEyRQBRNt7HRQxscLFKjW4p2"
    },
    {
      "received": "5495738194300275.00000000",
      "address": "F7dsocrKRY6qGdPx3un7yjmXnyte1o3rwi"
    },
    {
      "received": "5402740136988234.00000000",
      "address": "FBvU7ssxCzfdFxQ6tTvajAmRpQQGiUHYZA"
    },
    {
      "received": "5395738194277775.00000000",
      "address": "FHP7FQUWfeLfVSMHst8jwYaV8PKjejQAfC"
    },
    {
      "received": "5302740136965634.00000000",
      "address": "FKmqqGBomdYbMa4d99szcfM1KZBRNriaUC"
    },
    {
      "received": "5295738194255175.00000000",
      "address": "FDJ6fTXAbMQZQBUh7WxeMFx5C6R51C3BfU"
    },
    {
      "received": "5202740136943034.00000000",
      "address": "FQUgwbWmyUgXi28URqcUBU97jbigg76yQk"
    },
    {
      "received": "5195738194232575.00000000",
      "address": "FJeQN43TtrZdv2KaG9Vd94WVRnU4kwjpk7"
    },
    {
      "received": "5102740136920434.00000000",
      "address": "FQGbtf95Dio4dAtpvsE65qLk34CAyjfaqQ"
    },
    {
      "received": "5095738194209975.00000000",
      "address": "FDrRP5hhLtzGX2J9vUMi3MraWp4worjJYs"
    },
    {
      "received": "5002740136897834.00000000",
      "address": "FRaPeuNsatecr2Wr9DUh3obNB3oFN5NiUv"
    },
    {
      "received": "4999391162441978.00000000",
      "address": "FV7dWALo1dSAiyoHsrchscD4sy2er1notU"
    },
    {
      "received": "4995738194187475.00000000",
      "address": "FNcLSAhfFWR7aEzNLUDg2a3gXouk11aME7"
    },
    {
      "received": "4902740136875234.00000000",
      "address": "FKK7TB5Vh5VdWNoR3a2Fcfw5muzFFctHqs"
    },
    {
      "received": "4899391162419378.00000000",
      "address": "FCn7JUqoJ1wTmKY4fdoxjou6HTScwcKGtZ"
    },
    {
      "received": "4895738194164875.00000000",
      "address": "FD4Qwfo61Axt8cFAY1TuH4SkeMGTnrSkw4"
    },
    {
      "received": "4802740136852734.00000000",
      "address": "FKAaajHcTg8ys8nGAdnhCdFxM2gd15NXtP"
    },
    {
      "received": "4799391162396878.00000000",
      "address": "FC6cgehrKDbowxecniXGBPPDy54sQCRKmA"
    },
    {
      "received": "4795738194142275.00000000",
      "address": "F7WfQ36VMd3eoagMWMEmTAgc8ia4DXtPrx"
    },
    {
      "received": "4702740136830134.00000000",
      "address": "FALhkgBP3saubBtMH2AReS2yqVLoKCQ7pS"
    },
    {
      "received": "4699391162374278.00000000",
      "address": "FQm7UUMh2L2wkmcmepKB6Yd2UJyEGdB2jD"
    },
    {
      "received": "4695738194119675.00000000",
      "address": "FA4w6iBrhhUUMm2vTFHUNrXrqAu5wZNemJ"
    },
    {
      "received": "4602740136807534.00000000",
      "address": "FGsKECHkYWSPKDDiMxYLmwWfcm7a33Lf92"
    },
    {
      "received": "4599391162351678.00000000",
      "address": "FEqFDJ6oSuyvuVYGEREt5vubctKGopdrCP"
    },
    {
      "received": "4595738194097075.00000000",
      "address": "FA2Y17K7q1eM5bUpkJK9Kn92VkTtjgedxq"
    },
    {
      "received": "4502740136784934.00000000",
      "address": "FUhNoq6GyimpEooSPxyfxGvx6SZUYXyQiK"
    },
    {
      "received": "4499391162329178.00000000",
      "address": "FDmX9jPYMxGBDAaFuCNMMkjScnHiTaHgUW"
    },
    {
      "received": "4495738194074475.00000000",
      "address": "FNrRMCaBSLWj3zSiRgrTzVyRcUnmpzqeH4"
    },
    {
      "received": "4402740136762334.00000000",
      "address": "FDTjGpXQzC6ShP8sV3Rb2hJo53NHDKqP6o"
    },
    {
      "received": "4399391162306678.00000000",
      "address": "F6ordnvZRjrj23BQQNxZFWE323VezKNCPz"
    },
    {
      "received": "4395738194051875.00000000",
      "address": "F7VR5ecos2qZVxK9x5qpcdeScdH4uGaLrT"
    },
    {
      "received": "4302740136739734.00000000",
      "address": "FHkibw5bjvWUv81ZGpjmaKKpTUyDhBjCet"
    },
    {
      "received": "4299391162284078.00000000",
      "address": "FCFPmAyimCGYUUiWmHZTWHRfEQM4bctNUo"
    },
    {
      "received": "4295738194029275.00000000",
      "address": "FGUMqaYZE1uZV2tvozeFtfTkstY3zQhRcG"
    },
    {
      "received": "4202740136717234.00000000",
      "address": "FCPJYKq9vHVXjPkRaeBBtnoNvma9w1ARTF"
    },
    {
      "received": "4199391162261578.00000000",
      "address": "FRRAX3XjwcDj9JiAXbuBF56FsmSkTi8CAx"
    },
    {
      "received": "4195738194006675.00000000",
      "address": "FRmx9NVJtGZo9H7tgNVtLCMFjzyZnQwFNd"
    },
    {
      "received": "4109132419000000.00000000",
      "address": "F6r7pczBURQSQPN17wZMwAR2aCzsmTpWzC"
    },
    {
      "received": "4102740136694734.00000000",
      "address": "F7cGwnwud94kk9cnRD9b5waLQgboHf8rcy"
    },
    {
      "received": "4099391162239078.00000000",
      "address": "F9acFoa7nm4t8Gjufc6NqjjPmHazSAtdZC"
    },
    {
      "received": "4095738193984075.00000000",
      "address": "FGcFNmUt6ymi3MkJvjVKBR5BYKXgPee6DB"
    },
    {
      "received": "4002740136672134.00000000",
      "address": "FL4n1g134jPQ3g4kSxiY64mJpEZB8EP9VL"
    },
    {
      "received": "4000004000000000.00000000",
      "address": "FEzy91ryCkEgrrBuuw5fuNV95xyQQCrtpt"
    },
    {
      "received": "3999391162216478.00000000",
      "address": "FMywcXB6voNAN7HNqMdXzsgfvBQHD39osw"
    },
    {
      "received": "3995738193961575.00000000",
      "address": "FT85vV6GByYFnu6bJPxK1gUAa7787MnwfS"
    },
    {
      "received": "3902740136649534.00000000",
      "address": "FHKMhmnAj4UtjEK8BVQvBbybrirKrRsFVE"
    },
    {
      "received": "3899391162193878.00000000",
      "address": "FNuiZVaznkS3yTxRfJ21TBP8qi1Qb5YQKv"
    },
    {
      "received": "3895738193938975.00000000",
      "address": "FFKbD5WEdMwrnmWfcAyGxwEr5TrzD1Rfii"
    },
    {
      "received": "3802740136626934.00000000",
      "address": "F9917Go26hhRVz78s3vGm7KZNgjjWpL4tb"
    },
    {
      "received": "3799391162171278.00000000",
      "address": "FLQ78KwQNtwyT55kRFXT28UwxqJVPfB1RV"
    },
    {
      "received": "3795738193916475.00000000",
      "address": "F6fzq64i4wh8cv7e7tdsy6doiGhzuyf4hC"
    },
    {
      "received": "3702740136604334.00000000",
      "address": "F7ozReQQQJuodG3LpWxfQpkLRxm6WGMbwm"
    },
    {
      "received": "3699391162148678.00000000",
      "address": "FJrAprtEhAMWtB88BuQZtDkvRhvBkRo5bk"
    },
    {
      "received": "3695738193893975.00000000",
      "address": "FNz6z9kXxXFnjxSCeuRvEEyRpvreVCzREQ"
    },
    {
      "received": "3602740136581734.00000000",
      "address": "F6SZizMyXwFTdrqMKnKrXaokdNrVrEZYFg"
    },
    {
      "received": "3599391162126178.00000000",
      "address": "FAm5b7CuoCfQJHTHHpC5anFNwgdyW4ud5T"
    },
    {
      "received": "3595738193871375.00000000",
      "address": "FPykUfcafWJtRVFAYXbUN1gkGPYoRMUSBQ"
    },
    {
      "received": "3562356495988252.00000000",
      "address": "FJeo31YLAVVotvyTtYjDJvPZ1eAwGkS4Vw"
    },
    {
      "received": "3502740136559134.00000000",
      "address": "FKeaXQAzF6YMciAJWqAkAfcVSojyTerx8L"
    }
  ],
  "stats": {
    "last_block": 163489,
    "difficulty": "7591151.903561886",
    "moneysupply": "2684077532.3360767",
    "hashrate": "243364.2096",
    "supply": 2684077532.3360767,
    "blockcount": 163489,
    "connections": 109,
    "last_price": 0,
    "_id": "5e020327fe45c95428e829e6",
    "last": 154326,
    "coin": "fix",
    "__v": 0,
    "updatedAt": "2020-02-01T23:07:11.512Z",
    "masternodesCount": {
      "total": 2,
      "stable": 2,
      "obfcompat": 2,
      "enabled": 2,
      "inqueue": 2,
      "ipv4": 0,
      "ipv6": 2,
      "onion": 0
    },
    "createdAt": "2020-01-07T18:31:38.758Z"
  },
  "dista": {
    "percent": "25.49",
    "total": "684045117.97609675"
  },
  "distb": {
    "percent": "5.00",
    "total": "134243176.06000000"
  },
  "distc": {
    "percent": "4.75",
    "total": "127389649.89902496"
  },
  "distd": {
    "percent": "4.58",
    "total": "122846957.31000002"
  },
  "diste": {
    "percent": "60.19",
    "total": "1615552631.09095526"
  }
};

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const {url, method, headers, body} = request;

    // wrap in delayed observable to simulate server api call
    return of(null)
      .pipe(mergeMap(handleRoute))
      .pipe(materialize()) // call materialize and dematerialize to ensure delay even if an error is thrown (https://github.com/Reactive-Extensions/RxJS/issues/648)
      .pipe(delay(500))
      .pipe(dematerialize());

    function handleRoute() {
      switch (true) {
        case url.indexOf('/getAllBlocks') > -1 && method === 'GET':
          var host = window.location.protocol + '//' + window.location.host + '/';
          var array = url.replace(host, '').split('/');
          var wallet = array[2];
          var func = array[3];
          var limit = parseInt(array[4]);
          var offset = parseInt(array[5]);
          return getAllBlocks(wallet, limit, offset);
        case url.indexOf('/getBlockTxsByHash') > -1 && method === 'GET':
          var host = window.location.protocol + '//' + window.location.host + '/';
          var array = url.replace(host, '').split('/');
          var wallet = array[2];
          var func = array[3];
          var hash = array[4];
          return getBlock(wallet, hash);
        case url.indexOf('/getTxDetails') > -1 && method === 'GET':
          var host = window.location.protocol + '//' + window.location.host + '/';
          var array = url.replace(host, '').split('/');
          var wallet = array[2];
          var func = array[3];
          var hash = array[4];
          return getTx(wallet, hash);
        case url.indexOf('/getAddressTxs') > -1 && method === 'GET':
          var host = window.location.protocol + '//' + window.location.host + '/';
          var array = url.replace(host, '').split('/');
          var wallet = array[2];
          var func = array[3];
          var address = array[4];
          var limit = parseInt(array[5]);
          var offset = parseInt(array[6]);
          return getAddressTxs(wallet, limit, offset);
        case url.indexOf('/getAddressDetails') > -1 && method === 'GET':
          var host = window.location.protocol + '//' + window.location.host + '/';
          var array = url.replace(host, '').split('/');
          var wallet = array[2];
          var func = array[3];
          var address = array[4];
          return getAddressDetails(wallet, address);
        case url.indexOf('/getRichlist') > -1 && method === 'GET':
          var host = window.location.protocol + '//' + window.location.host + '/';
          var array = url.replace(host, '').split('/');
          var wallet = array[2];
          return getRichlist(wallet);
        default:
          // pass through any requests not handled above
          return next.handle(request);
      }
    }

    function getAllBlocks(wallet, limit, offset) {
      return ok(blocks.slice(offset*limit, limit + offset*limit));
    }
    function getBlock(wallet, hash) {
      return ok(block);
    }
    function getTx(wallet, hash) {
      return ok(tx);
    }
    function getAddressTxs(wallet, limit, offset) {
      return ok(addressTxs.slice(offset*limit, limit + offset*limit));
    }
    function getAddressDetails(wallet, addr) {
      return ok(addressDetails);
    }
    function getRichlist(wallet) {
      return ok(richlist);
    }

    function ok(body?) {
      return of(new HttpResponse({ status: 200, body }))
    }
  }
}
