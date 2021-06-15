import api
import pandas as pd
from float import *


tickers = api.getMarketTicker()


btcinrTicker = tickers['btcinr']
btcusdtTicker = tickers['btcusdt']
usdtinrTicker = tickers['usdtinr']


GWFeePercent = float(1.5)
gst = float(0.18)
totalGWPercent = GWFeePercent * (1 + gst)

btcInrRateViaGW = float(btcinrTicker['sell']) / (100 - totalGWPercent) * 100


# get p2p rate
latestP2PTrade = api.getP2PTrades('usdtinr')[0]

p2pUsdtInrRate = float(latestP2PTrade['price'])
marketBtcUsdtRate = float(btcusdtTicker['sell'])


## money that you want to invest
investMoney = 100000
# how much usdt can I buy and what avg price?

# get avg p2p rate from order book
asks = api.getP2POrderBook('usdtinr', 20)['asks']

totalVol = 0
totalRs = 0
totalUnits = 0
avgPrice = 0
moneyLeft = investMoney
for ask in asks:
	boughtValue = float(ask[0]) * float(ask[1])
	if investMoney <= totalRs + boughtValue:
		leftMoney = max(investMoney - totalRs, 0)
		if leftMoney == 0: break
		unitsBought = leftMoney / float(ask[0])
		totalRs += leftMoney
	else:
		unitsBought = float(ask[1])
		totalRs += boughtValue

	totalVol += float(ask[1])
	totalUnits += unitsBought
	avgPrice = totalRs/totalUnits
	ask.append(totalVol)
	ask.append(round(unitsBought,2))
	ask.append(round(totalUnits,2))
	ask.append(round(totalRs,2))
	ask.append(round(avgPrice,2))

df = pd.DataFrame(asks, columns=['Sell Price', 'Volume', 'Orders', 'Total volume','Units Bought', 'Total Units', 'Total Rs', 'Avg Price'])
print(df)


netP2pRate = p2pUsdtInrRate * marketBtcUsdtRate
avgP2pRate = avgPrice * marketBtcUsdtRate

print(f'-- btcinr --  Last:', btcinrTicker['last'],  'Buy:', btcinrTicker['buy'], 'Sell:', btcinrTicker['sell'])
print(f'-- btcusdt --  Last:', btcusdtTicker['last'],  'Buy:', btcusdtTicker['buy'], 'Sell:', btcusdtTicker['sell'])
print(f'-- usdtinr --  Last:', usdtinrTicker['last'],  'Buy:', usdtinrTicker['buy'], 'Sell:', usdtinrTicker['sell'])
print(f'-- btcinr --', 'gateway rate:', btcInrRateViaGW, 'p2p rate:', netP2pRate, 'avg p2p rate:', round(avgP2pRate,2))
print('\n')

percentDiff = (netP2pRate - btcInrRateViaGW)/ netP2pRate * 100 if btcInrRateViaGW <= netP2pRate else (btcInrRateViaGW - netP2pRate)/ btcInrRateViaGW * 100
print('BUY FROM', 'GATEWAY' if btcInrRateViaGW <= netP2pRate else 'P2P', round(percentDiff, 2), '% lesser than', 'P2P' if btcInrRateViaGW <= netP2pRate else 'GATEWAY')

percentDiff = (avgP2pRate - btcInrRateViaGW)/ avgP2pRate * 100 if btcInrRateViaGW <= avgP2pRate else (btcInrRateViaGW - avgP2pRate)/ btcInrRateViaGW * 100
print('BUY FROM', 'GATEWAY' if btcInrRateViaGW <= avgP2pRate else 'AVG_P2P', round(percentDiff, 2), '% lesser than', 'AVG_P2P' if btcInrRateViaGW <= avgP2pRate else 'GATEWAY')
