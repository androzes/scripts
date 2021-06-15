import requests


# market = 'btcinr'  '<base currecy><quote currency>'

'''
when market='btcinr'
{
    "at": 1622699457,
    "ticker": {
        "buy": "2957108.0",
        "sell": "2959000.0",
        "low": "2793444.0",
        "high": "2978983.0",
        "last": "2956984.0",
        "vol": "439.76916"
    }
}

when market='' all tickers are fetched
{
    "btcinr": {
        "base_unit": "btc",
        "quote_unit": "inr",
        "low": "2793444.0",
        "high": "2978983.0",
        "last": "2966391.0",
        "type": "SPOT",
        "open": 2817860.0,
        "volume": "439.76916",
        "sell": "2966433.0",
        "buy": "2966392.0",
        "at": 1622699521,
        "name": "BTC/INR"
    },
    ...
    ...
}

NOTE: not p2p markets here
'''
def getMarketTicker(market=''):
	func_args = locals()
	r = requests.get(f'https://api.wazirx.com/api/v2/tickers/{market}')
	if r.status_code != 200:
		raise Exception(f'{__name__} with {func_args} failed with status_code:{status_code}')

	return r.json()['ticker'] if market != '' else r.json()




'''
SAMPLE RESPONSE:

	{
	    "timestamp": 1622699125,
	    "bids": [
	        [
	            "100",      // price
	            "23.75",    // total vol at this price
	            1           // num of orders
	        ]
	    ],
	    "asks": [
	        [
	            "77",
	            "175.36",
	            3
	        ]
	    ]
	}
'''
def getP2POrderBook(market, limit=10):
	func_args = locals()
	r = requests.get(f'https://x.wazirx.com/wazirx-falcon/api/v1.0/p2p/order-book?market={market}&limit={limit}')
	if r.status_code != 200:
		raise Exception(f'{__name__} with {func_args} failed with status_code:{status_code}')
	return r.json()



'''
[
    {
        "id": 2536663,
        "price": 78.05,
        "funds": 46830,       					// ??
        "volume": 600,
        "market": "usdtinr",
        "createdAt": "2021-06-03T05:56:04Z"		// time in UTC
    },
    {
        "id": 2536662,
        "price": 78.05,
        "funds": 99999.22,
        "volume": 1281.22,
        "market": "usdtinr",
        "createdAt": "2021-06-03T05:55:49Z"
    },
    ...
]
'''
def getP2PTrades(market, limit=10):
	func_args = locals()
	r = requests.get(f'https://x.wazirx.com/wazirx-falcon/api/v1.0/p2p/trade-matches?market={market}&limit={limit}')
	if r.status_code != 200:
		raise Exception(f'{__name__} with {func_args} failed with status_code:{status_code}')
	return r.json()


'''
{
    "markets": [
        {
            "baseMarket": "xrp",
            "quoteMarket": "btc",
            "minBuyAmount": 0.0001,
            "minSellAmount": 0.0001,
            "basePrecision": 1,
            "quotePrecision": 8,
            "status": "active",
            "fee": {
                "bid": {
                    "maker": 0.002,
                    "taker": 0.002
                },
                "ask": {
                    "maker": 0.002,
                    "taker": 0.002
                }
            },
            "low": "0.00002658",
            "high": "0.00002759",
            "last": "0.00002658",
            "type": "SPOT",
            "open": 2.721e-05,
            "volume": "5593.2",
            "sell": "0.00002694",
            "buy": "0.00002662",
            "at": 1622700670
        }, ...
    ],
    "assets": [
        {
            "type": "1inch",
            "name": "1inch",
            "deposit": "enabled",
            "withdrawal": "enabled",
            "listingType": "default",
            "category": "crypto",
            "withdrawFee": 3.82,
            "minWithdrawAmount": 7.64,
            "maxWithdrawAmount": 764.82,
            "minDepositAmount": 0,
            "confirmations": 30
        },
        {
            "type": "xyit",
            "name": "Youth Incredible Token",
            "deposit": "disabled",
            "withdrawal": "disabled",
            "listingType": "default",
            "category": "smart_token"
        },
    ]

'''
def getMarketStatus():
	func_args = locals()
	url = "https://api.wazirx.com/api/v2/market-status"
	r = requests.get(url)
	if r.status_code != 200:
		raise Exception(f'{__name__} with {func_args} failed with status_code:{status_code}')
	return r.json()

