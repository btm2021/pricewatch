const express = require('express')
const app = express()
const port = 3000
var wsClientList = [];
var compression = require('compression')
const cors = require('cors')
const enableWs = require('express-ws')
var bodyParser = require('body-parser')

enableWs(app)
app.use(compression())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.ws('/ws', (ws, req) => {
    wsClientList.push(ws);
    ws.on('message', msg => {
        oneInsert({
            name: 'BTCUSDT',
            timeframe: '15m',
            type: 'SPOT',
            time: (new Date).valueOf(),
            priceList: JSON.stringify([1, 3, 3, 4, 5]),
            indicatorList: JSON.stringify([
                {
                    name: 'supertrend',
                    list: [3, 4, 5, 6]
                },
                {
                    name: 'ema',
                    list: [1, 2, 3, 4]
                }
            ])
        }).then(data => {
            ws.send('ok')
        })
    })
    ws.on('close', () => {
        wsClientList = wsClientList.filter(item => { item === ws })
        console.log('WebSocket was closed')
    })
})
app.get('/', (req, res) => {
    res.send({ hello: "world" })
})
app.get('/b', (req, res) => {
    res.sendFile(__dirname + '/plot.html');
})
app.get('/bb', (req, res) => {

    const fs = require("fs");
    fs.readFile("./abc.csv", 'utf8', (err, data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
    })
})
app.get('/getOne', (req, res) => {
    let { name, type, timeframe } = req.query
    priceDB.find({ name, type, timeframe }).then(data => {
        res.send(data)
    })
})
app.get('/getAll', (req, res) => {
    priceDB.find({}).then(data => {
        res.send(data)
    })
})
app.get('/listSupport', (req, res) => {
    let { type } = req.query
    db.symbolSupport.find({ type }).then(data => {
        res.send(formatListSupportJSONResult(data))
    })
})
app.post('/configmybot', (req, res) => {
    let { noti, emaPeriod, spPeriod, spMul, psarMaxCount, psarStep, psarMax, minVol } = req.body
    IndicatorConfig.noti = noti
    IndicatorConfig.minVolume = minVol
    IndicatorConfig.signal.emaPeriod = emaPeriod
    IndicatorConfig.signal.spPeriod = spPeriod
    IndicatorConfig.signal.spMul = spMul
    IndicatorConfig.signal.psarMax = psarMax
    IndicatorConfig.signal.psarMaxCount = psarMaxCount
    IndicatorConfig.signal.psarStep = psarStep
})
function formatListSupportJSONResult(data) {

    let result = []
    data.map(item => {
        //check 
        let { _id, id, type, symbol, time } = { ...item }
        result.push({
            _id, id, type, time,
            symbol: JSON.parse(symbol),
        })
    })

    return result;
}

const url = 'mongodb+srv://bao1:123@cluster0.3s16wqd.mongodb.net/crypto?retryWrites=true&w=majority';
const mongoist = require('mongoist');
const db = mongoist(url);
const priceDB = db.price;
db.on('connect', function () {
    console.log('database connected')
})
function sendToWs(mes) {
    wss.clients.forEach(function each(client) {
        client.send(msg);
    });
}
function sendNotification(msg) {
    IndicatorConfig.noti.map(item => {
        //send msg to item
    })
}
async function oneInsert(data) {
    return new Promise((resolve, reject) => {
        let { name, timeframe, time, type, indicatorList } = data;
        priceDB.findAndModify({
            query: { name, timeframe, type },
            update: { $set: { name, time, type, indicatorList } },
            upsert: true,
        }).then(data => {
            resolve(data)
        }).catch(err => {
            reject(err)
        });
    })
}

//*binance
var volumeSensor = 2
const delay = require('delay')
const Binance = require('node-binance-api');
const ta = require('ta.js');
const moment = require('moment')
const binance = new Binance({
    recvWindow: 60000, // Set a higher recvWindow to increase response timeout
})
var IndicatorConfig = {
    noti: [123, 123],
    signal: {
        emaPeriod: 30,
        spPeriod: 13,
        spMul: 2.5,
        psarMaxCount: 2,
        psarStep: 0.02,
        psarMax: 0.02
    },
    minVolume: 2,
    sma: {
        period: 14
    },
    smma: {
        period: 14
    },
    wma: {
        period: 14
    },
    ema: {
        period: 14
    },
    vwma: {
        period: 20
    },
    kama: {
        period1: 10,
        period2: 2,
        period3: 30
    },
    macd: {
        period1: 12,
        period2: 26
    },
    rsi: {
        period: 14
    },
    tsi: {
        long: 3,
        short: 2,
        signal: 2
    },
    bop: {
        period: 13
    },
    fi: {
        period: 13
    },
    alligator: {
        jaw: 13,
        teeth: 8,
        lip: 5,
        shiftjaw: 8,
        teethshift: 5,
        lipshift: 3
    },
    willpercentr: {
        period: 14
    },
    stochastics: {
        length: 2,
        smoothd: 1,
        smoothk: 1
    },
    ichimoku: {
        length1: 9,
        length2: 26,
        length3: 52,
        displacement: 26
    },
    atr: {
        period: 3
    },
    aroon: {
        up: 10,
        down: 10
    },
    roc: {
        length: 14
    },
    kst: {
        r1: 10,
        s1: 10,
        r2: 15,
        s2: 10,
        r3: 20,
        s3: 10,
        r4: 30,
        s4: 15,
        signal: 9
    },
    mom: {
        length: 10,
        percent: false
    },
    hafltrend: {
        atrlend: 6,
        amplitude: 3,
        deviation: 2
    },
    superTrend: {
        length: 8,
        multi: 3

    },
    supportLine: {

    },
    resistantLine: {

    },
    ao: {
        short: 5,
        long: 35,
    },
    chaikin_osc: {
        length1: 3,
        length2: 10
    }

}
var ListBANSymbol = ['LUNA', '1000']
function getListBinanceSupport() {
    binance.futuresExchangeInfo().then(rawFuturesExchangeInfo => {
        if (rawFuturesExchangeInfo) {
            let listAsset = rawFuturesExchangeInfo.symbols;
            let listSymbolNotIncluceBUSD = listAsset.filter(pair => {
                return (!ListBANSymbol.includes(pair.symbol) && !(pair.symbol.includes("BUSD")) && !(pair.symbol.includes("_")))
            })
            let listSupport = []
            listSymbolNotIncluceBUSD.map(item => {
                listSupport.push({ symbol: item.symbol, exchangeInfo: item })
            })
            let type = 'future'
            let time = (new Date()).valueOf();
            db.symbolSupport.findAndModify({
                query: { id: '1', type },
                update: { $set: { symbol: JSON.stringify(listSupport), time, type: 'future' } },
                upsert: true,
            }).then(data => {
                // console.log(data)
            }).catch(err => {
                console.log(err)
            });
        }
    })
    binance.exchangeInfo().then(rawFuturesExchangeInfo => {
        if (rawFuturesExchangeInfo) {
            let listAsset = rawFuturesExchangeInfo.symbols;

            let listSupport = []
            listAsset.map(item => {
                listSupport.push({ symbol: item.symbol, exchangeInfo: item })
            })
            let type = 'spot'
            let time = (new Date()).valueOf();
            db.symbolSupport.findAndModify({
                query: { id: '2', type },
                update: { $set: { symbol: JSON.stringify(listSupport), time, type: 'spot', exchange: 'binance' } },
                upsert: true,
            }).then(data => {
                //console.log(data)
            }).catch(err => {
                console.log(err)
            });
            setTimeout(() => {
                getListBinanceSupport();
            }, 1000 * 60 * 60 * 2)

        }
    })

}

function sendMessageToWS(msg) {
    wsClientList.forEach((ws) => {
        ws.send(msg)
    })
}

function superTrend(data, period, multiplier, name, timeframe) {
    var Stock = require("stock-technical-indicators")
    const Indicator = Stock.Indicator
    const { Supertrend } = require("stock-technical-indicators/study/Supertrend")
    const newStudyATR = new Indicator(new Supertrend());
    let a = (newStudyATR.calculate(data, { period, multiplier }))
    //
    return a;
}
function mybot(data, name, timeframe, dataSuperTrend) {
    //* tính psar
    let high = []
    let low = []
    let dataClosePSAR = []

    data.map(item => {
        dataClosePSAR.push(item.close)
        high.push(item.high)
        low.push(item.low)
    })
    let step = IndicatorConfig.signal.psarStep
    let max = IndicatorConfig.signal.psarMax

    let PSAR = require('technicalindicators').PSAR;
    let _psar = PSAR.calculate({ high, low, step, max })
    //check _psar change, kiểm tra giá psar cây trước đó, nếu cây trước đó đang nằm dưới giá mà cây hiện tại trên giá thì gọi là 
    //chuyển chuyển trend từ up sang down
    let __psar = []
    let barCount = 1;
    for (let i = 1; i < _psar.length; i++) {
        let lastPsar = _psar[i - 1]
        let currentPsar = _psar[i]
        let lastClose = dataClosePSAR[i - 1]
        let currentClose = dataClosePSAR[i]
        let lastTrend = (lastClose > lastPsar) ? 1 : -1
        let currentTrend = (currentClose > currentPsar) ? 1 : -1
        if (lastTrend != currentTrend) {
            __psar.push({
                psar: currentPsar,
                trend: currentTrend,
                isStartTrend: true,
                index: i,
                close: currentClose,
                barCount: 1
            })
            barCount = 1;
        } else {
            __psar.push({
                psar: currentPsar,
                trend: currentTrend,
                isStartTrend: false,
                index: i,
                close: currentClose,
                barCount
            })
            barCount++;
        }
    }
    __psar.unshift(0)
    //* tính ema14,
    let st = superTrend(dataSuperTrend, IndicatorConfig.signal.spPeriod, IndicatorConfig.signal.spMul, name, timeframe)
    const EMA = require('technicalindicators').EMA
    let period = IndicatorConfig.signal.emaPeriod;
    let dataClose = []
    data.map(item => {
        dataClose.push((item.high + item.low) / 2)
    })
    let ema10 = EMA.calculate({ period: period, values: dataClose })
    let ema50 = EMA.calculate({ period: 100, values: dataClose })

    for (let i = 0; i < period - 1; i++) {
        ema10.unshift(0)
    }
    for (let i = 0; i < 100 - 1; i++) {
        ema50.unshift(0)
    }

    let signal = []
    for (let i = 1; i < st.length - 1; i++) {
        if (st[i].Supertrend.Direction != st[i - 1].Supertrend.Direction) {
            signal.push({
                index: i,
                st: st[i]
            });
        }
    }
    let result = []
    data.map((item, index) => {
        let _st = {
            Direction: (st[index].Supertrend.Direction) ? 0 : 1,
            Up: (st[index].Supertrend.Up) ? st[index].Supertrend.Up : 0,
            Down: (st[index].Supertrend.Down) ? st[index].Supertrend.Down : 0,
            ActiveTrend: (st[index].Supertrend.ActiveTrend) ? st[index].Supertrend.ActiveTrend : 0,
        }
        //lọc tín hiệu nhiễu

        let _signal = signal.find(i => i.index === index)
        if (_signal) {
            //kiểm tra ema hiện tại
            let emaCurrent = ema10[index]
            let spCurrent = _signal.st.Supertrend
            let close = data[index].close
            let side = (_signal.st.Supertrend.Direction > 0) ? "LONG" : "SHORT"

            //check supertrend trước cùng trend thì bỏ qua
            //lấy index trend hiện tại
            let _indexCurrentSp = signal.findIndex(i => i.index === index)
            let psarCurrent = __psar[index]
            //nếu bắt đầu superTrend và __psar count cùng chiều 
            let psarSide = (psarCurrent.trend > 0) ? "LONG" : "SHORT";
            //check psar, nếu psar trong chu kì hiện tại hoặc trong 4 chu kì trước cùng chiều thì vào lệnh
            if (side === "LONG" && close > emaCurrent && psarSide === "LONG" && psarCurrent.barCount < IndicatorConfig.signal.psarMaxCount) {

                if (_indexCurrentSp != 0) {
                    //lấy suppertrend trước
                    let preSp = signal[_indexCurrentSp - 1]
                    //lấy ra hướng
                    let Dicrection = preSp.st.Supertrend.Direction;
                    //kiểm tra với sp hiện tại,nếu giống thì bỏ qua hiện tại
                    if (Dicrection === spCurrent.Dicrection) {
                        _signal = 0
                    } else {
                        _signal = _signal.st.Supertrend
                    }
                }

            } else if (side === "SHORT" && close < emaCurrent && psarSide === "SHORT" && psarCurrent.barCount < IndicatorConfig.signal.psarMaxCount) {
                if (_indexCurrentSp != 0) {
                    //lấy suppertrend trước
                    let preSp = signal[_indexCurrentSp - 1]
                    //lấy ra hướng
                    let Dicrection = preSp.st.Supertrend.Direction;
                    //kiểm tra với sp hiện tại,nếu giống thì bỏ qua hiện tại
                    if (Dicrection === spCurrent.Dicrection) {
                        _signal = 0
                    } else {
                        _signal = _signal.st.Supertrend
                    }
                }
            } else {
                _signal = 0
            }
        } else {
            _signal = 0
        }
        result.push({ ...item, st: _st, ema10: ema10[index], ema50: ema50[index], signal: _signal, psar: __psar[index] })
    })
    //ghi lên db 
    const fs = require('fs');
    fs.writeFile("abc.csv", JSON.stringify(result), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });


}
var alertList = []
async function getIndicator(tick, name, timeframe) {
    return new Promise(async (resolve, reject) => {
        let dataSuperTrend = []
        let dataClose = []
        let dataCloseVolume = []//[close, volume]
        let dataOpenHighLowClose = []//[open, high, low, close]
        let dataHighCloseLow = []//[high,close,low]
        let dataAssetVolumeClose = []//[assetVolume,close]
        let dataHighLow = []
        let dataHighCloseLowVolume = []
        let dataFull = []
        let dataTime = []
        let dataCloseTime = []
        let dataCloseVolumeTime = []
        tick.map(i => {

            let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = i;
            dataTime.push({
                time, close
            })

            dataSuperTrend.push([
                new Date(time),
                parseFloat(open),
                parseFloat(high),
                parseFloat(low),
                parseFloat(close),
                parseFloat(volume)
            ])
            dataCloseVolumeTime.push([parseFloat(close), parseFloat(volume), parseFloat(time)])
            dataFull.push({
                time: parseFloat(time),
                open: parseFloat(open),
                high: parseFloat(high),
                low: parseFloat(low),
                close: parseFloat(close),
                volume: parseFloat(volume),
                closeTime: parseFloat(closeTime),
                assetVolume: parseFloat(assetVolume),
                trades: parseFloat(trades),
                buyBaseVolume: parseFloat(buyBaseVolume),
                buyAssetVolume: parseFloat(buyAssetVolume),
                ignored: parseFloat(ignored)
            })
            dataCloseTime.push([parseFloat(close), parseFloat(time)])
            dataClose.push(parseFloat(close))
            dataOpenHighLowClose.push([parseFloat(open), parseFloat(high), parseFloat(low), parseFloat(close)])
            dataHighCloseLowVolume.push([parseFloat(high), parseFloat(close), parseFloat(low), parseFloat(volume)])
            dataHighLow.push([parseFloat(high), parseFloat(low)])
            dataAssetVolumeClose.push([parseFloat(assetVolume), parseFloat(close)])
            dataCloseVolume.push([parseFloat(close), parseFloat(volume)])
            dataHighCloseLow.push([parseFloat(high), parseFloat(close), parseFloat(low)])
        })
        //* alert
        //1. volume cao x2
        let aa = mybot(dataFull, name, timeframe, dataSuperTrend)

        //sendMessageToWS(msg)

        let volumeLast = dataCloseVolume[dataCloseVolume.length - 2][1];
        let volumeCurrent = dataCloseVolume[dataCloseVolume.length - 1][1];
        if (volumeCurrent >= volumeLast * volumeSensor) {
            //có sự bơm
            //kiểm tra trong alertList có symbol chưa
            let sym = alertList.findIndex(i => { i.name === name && i.timeframe === timeframe })
            if (sym > 0) {
                //có, lấy count và tăng lên 1
                var a = alertList[sym].count;
                if (a < 5) {
                    alertList[sym].count += 1;
                    let msg = {
                        cataloge: 'volume',
                        type: 'alert',
                        message: `Symbol ${name} Volume có sự gia tăng volume, giá trước ${dataCloseVolume[dataCloseVolume.length - 2][0]} giá hiện tại ${dataCloseVolume[dataCloseVolume.length - 2][0]}, volume cũ ${volumeLast}, volume mới${volumeCurrent} tăng gấp ${(volumeCurrent / volumeCurrent).toFixed(1)} lần`
                    }
                    sendMessageToWS(msg)
                }

            } {
                //không tạo mới 1 alertList
                alertList.push({
                    name, timeframe, count: 0
                })
            }
            //tìm ra count, nếu count >5 ko gửi nữa
        } else {
            //reset count
            alertList = alertList.filter(i => { i.name !== name && i.timeframe !== timeframe })
        }

        // let mybotsignal = await myBot(dataClose, 14, 0.02, name, timeframe)
        //  console.log(mybotsignal)
        //*
        //2. ema giao cắt
        // let _emaCross1 = await ta.ema(dataCloseTime, 9)
        // let _emaCross2 = await ta.ema(dataCloseTime, 10)
        // let _cross = await check_cross(_emaCross1, _emaCross2)
        //myBot(dataClose, 14, 0.02);dxvzc

        // let sma = await ta.sma(dataClose, IndicatorConfig.sma.period);//close
        // let smma = await ta.smma(dataClose, IndicatorConfig.smma.period);//close
        // let wma = await ta.wma(dataClose, IndicatorConfig.wma.period);//close
        // let ema = await ta.ema(dataClose, IndicatorConfig.ema.period);//close
        // let vwma = await ta.vwma(dataCloseVolume, IndicatorConfig.vwma.period);
        // let kama = await ta.kama(dataClose, IndicatorConfig.kama.period1, IndicatorConfig.kama.period2, IndicatorConfig.kama.period3);
        // let macd = await ta.macd(dataClose, IndicatorConfig.macd.period1, IndicatorConfig.macd.period2);//close
        // let rsi = await ta.rsi(dataClose, IndicatorConfig.rsi.period);//close
        // //True Strength Index (TSI)
        // let tsi = await ta.tsi(dataClose, IndicatorConfig.tsi.long, IndicatorConfig.tsi.short, IndicatorConfig.tsi.signal);
        // //Balance Of Power [open, high, low, close]
        // let bop = await ta.bop(dataOpenHighLowClose, IndicatorConfig.bop.period)
        // //Force Index [close, volume]
        // let fi = await ta.fi(dataCloseVolume, IndicatorConfig.fi.period)
        // //Accumulative Swing Index [high,close,low]
        // let asi = await ta.asi(dataHighCloseLow);
        // //Alligator Indicator
        // let alligator = await ta.alligator(dataClose, IndicatorConfig.alligator.jaw, IndicatorConfig.alligator.teeth, IndicatorConfig.alligator.lip, IndicatorConfig.alligator.jawshift, IndicatorConfig.alligator.teethshift, IndicatorConfig.alligator.lipshift)
        // //Williams %R
        // let wp = await ta.pr(dataClose, IndicatorConfig.willpercentr.period)
        // //Stochastics [high, close, low]
        // let stochastics = await ta.stoch(dataHighCloseLow, IndicatorConfig.stochastics.length, IndicatorConfig.stochastics.smoothd, IndicatorConfig.stochastics.smoothk)
        // //Ichimoku Cloud [high, close, low]
        // let ichimoku = await ta.ichimoku(dataHighCloseLow, IndicatorConfig.ichimoku.length1, IndicatorConfig.ichimoku.length2, IndicatorConfig.ichimoku.length3, IndicatorConfig.ichimoku.displacement)
        // //Average True Range (ATR) [high, close, low]
        // let atr = await ta.atr(dataHighCloseLow, IndicatorConfig.atr.period)
        // //Aroon Up 
        // let aroonUp = await ta.aroon.up(dataClose, IndicatorConfig.aroon.up)
        // let aroonDown = await ta.aroon.down(dataClose, IndicatorConfig.aroon.down);
        // let aroon = {
        //     up: aroonUp[aroonUp.length - 1],
        //     down: aroonDown[aroonDown.length - 1]
        // }
        // let roc = await ta.roc(dataClose, IndicatorConfig.roc.length)
        // //Know Sure Thing
        // let kst = await ta.kst(dataClose, IndicatorConfig.kst.r1, IndicatorConfig.kst.r2, IndicatorConfig.kst.r3, IndicatorConfig.kst.r4, IndicatorConfig.kst.s1, IndicatorConfig.kst.s2, IndicatorConfig.kst.s3, IndicatorConfig.kst.s4, IndicatorConfig.kst.signal);
        // //On-Balance Volume[asset volume, close price]
        // let obv = await ta.obv(dataAssetVolumeClose)
        // //Momentum
        // let mom = await ta.mom(dataClose, IndicatorConfig.mom.length, IndicatorConfig.mom.percent);
        // //HalfTrend data = [high, close, low]
        // let halfTrend = await ta.halftrend(dataHighCloseLow, IndicatorConfig.hafltrend.atrlend, IndicatorConfig.hafltrend.amplitude, IndicatorConfig.hafltrend.deviation);
        // //SuperTrend= [high, close, low]
        // let superTrend = await ta.supertrend(dataHighCloseLow, IndicatorConfig.superTrend.length, IndicatorConfig.superTrend.multi);
        // let _superTrend = []
        // // let sp = await getSupertrend(dataHighCloseLow, 8, 3);
        // // for (let i = 0; i < superTrend.length; i) {
        // //     let priceIndex = (IndicatorConfig.superTrend.length - 1) + i
        // //     let timeAt = dataTime[priceIndex].time;
        // //     let closeAt = parseFloat(dataTime[priceIndex].close);
        // //     let up = superTrend[i][0]
        // //     let down = superTrend[i][1]
        // //     let direction = (closeAt > up) ? "LONG" : "SHORT"
        // //     _superTrend.push({
        // //         up, down, direction, timeAt, closeAt
        // //     })
        // //     i++;
        // // }
        // //Awesome Oscillator [high, low]



        // let ao = await ta.ao(dataHighLow, IndicatorConfig.ao.short, IndicatorConfig.ao.long);
        // //Chaikin Oscillator [high, close, low, volume]
        // let chainking = await ta.chaikin_osc(dataHighCloseLowVolume, IndicatorConfig.chaikin_osc.length1, IndicatorConfig.chaikin_osc.length2);
        // //TechnicalIndicators.js


        // //Support Line

        // //Resistance Line

        // // // CandleStick Pattern
        // // let dataTwo = {}
        // // let dataThree = {}
        // // let dataOne = {}
        // // let a_open = []
        // // let a_high = []
        // // let a_close = []
        // // let a_low = []

        // // //1 nến
        // // for (let i = tick.length - 2; i < tick.length - 1; i++) {
        // //     let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick[i];
        // //     a_open.push(parseFloat(open))
        // //     a_high.push(parseFloat(high))
        // //     a_close.push(parseFloat(close))
        // //     a_low.push(parseFloat(low))
        // // }
        // // dataOne.open = a_close
        // // dataOne.high = a_high
        // // dataOne.close = a_close
        // // dataOne.low = a_low

        // // a_close = []
        // // a_open = []
        // // a_low = []
        // // a_high = []
        // // //2 nến
        // // for (let i = tick.length - 3; i < tick.length - 1; i++) {
        // //     let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick[i];
        // //     a_open.push(parseFloat(open))
        // //     a_high.push(parseFloat(high))
        // //     a_close.push(parseFloat(close))
        // //     a_low.push(parseFloat(low))
        // // }
        // // dataTwo.open = a_close
        // // dataTwo.high = a_high
        // // dataTwo.close = a_close
        // // dataTwo.low = a_low

        // // a_close = []
        // // a_open = []
        // // a_low = []
        // // a_high = []
        // // // 3 cây
        // // for (let i = tick.length - 4; i < tick.length - 1; i++) {
        // //     let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick[i];
        // //     a_open.push(parseFloat(open))
        // //     a_high.push(parseFloat(high))
        // //     a_close.push(parseFloat(close))
        // //     a_low.push(parseFloat(low))
        // // }
        // // dataThree.open = a_close
        // // dataThree.high = a_high
        // // dataThree.close = a_close
        // // dataThree.low = a_low


        // // let patternCheck = {
        // //     abandonedbaby: abandonedbaby(dataThree),
        // //     bearishengulfingpattern: bearishengulfingpattern(dataTwo),
        // //     bullishengulfingpattern: bullishengulfingpattern(dataTwo),
        // //     darkcloudcover: darkcloudcover(dataTwo),
        // //     downsidetasukigap: downsidetasukigap(dataThree),
        // //     doji: doji(dataOne),
        // //     dragonflydoji: dragonflydoji(dataOne),
        // //     gravestonedoji: gravestonedoji(dataOne),
        // //     bullishharami: bullishharami(dataTwo),
        // //     bearishharami: bearishharami(dataTwo),
        // //     bullishharamicross: bullishharamicross(dataTwo),
        // //     bearishharamicross: bearishharamicross(dataTwo),
        // //     bullishmarubozu: bullishmarubozu(dataOne),
        // //     bearishmarubozu: bearishmarubozu(dataOne),
        // //     eveningdojistar: eveningdojistar(dataThree),
        // //     eveningstar: eveningstar(dataThree),
        // //     bullishspinningtop: bullishspinningtop(dataOne),
        // //     bearishspinningtop: bearishspinningtop(dataOne),
        // //     morningstar: morningstar(dataThree),
        // //     morningdojistar: morningdojistar(dataThree),
        // //     threeblackcrows: threeblackcrows(dataThree),
        // //     threewhitesoldiers: threewhitesoldiers(dataThree),
        // //     bullishhammerstick: bullishhammerstick(dataOne),
        // //     bearishhammerstick: bearishhammerstick(dataOne),
        // //     bullishinvertedhammerstick: bullishinvertedhammerstick(dataOne),
        // //     //    tweezerbottom: tweezerbottom(dataThree),
        // //     //  tweezertop: tweezertop(dataThree)
        // // }
        // // let patternDetect = []
        // // Object.keys(patternCheck).forEach(key => {
        // //     if (patternCheck[key]) {
        // //         patternDetect.push({
        // //             pattern: key
        // //         })
        // //     }
        // //     // key , value
        // // })


        // // cẩn 1 cây cuối doji,dragonflydoji,Bullish Marubozu,bearishmarubozu,Bullish Hammer

        // // cần 2 cây cuối  bearishengulfingpattern,darkcloudcover,Bullish Harami,Bearish Harami Cross,Bearish Harami,
        // //Morning Doji Star,

        // // cần 3 cây cuối abandoned-baby,downsidetasukigap,Evening Doji Star,Three Black Crows
        // //let {name, timeframe, time, type, priceList, indicatorList} = data;
        let time = (new Date()).valueOf();
        resolve({
            name, timeframe, time, type: 'future',
            // priceList: JSON.stringify(dataFull),
            // indicatorList: JSON.stringify({
            //     _superTrend,
            //     rsi: rsi[rsi.length - 1]
            // })
        })
        // resolve({
        //     dataFull, superTrendFull: superTrend,
        //     name, timeframe,
        //     sma: sma[sma.length - 1], smma: smma[[smma.length - 1]], wma: [wma.length - 1], ema: ema[ema.length - 1],
        //     vwma: vwma[vwma.length - 1], kama: kama[kama.length - 1], macd: [macd.length - 1], rsi: rsi[rsi.length - 1],
        //     tsi: tsi[tsi.length - 1], bop: bop[bop.length - 1], fi: fi[fi.length - 1], asi: asi[asi.length - 1], alligator: alligator[alligator.length - 1],
        //     wp: wp[wp.length - 1], stoch: stochastics[stochastics.length - 1], ichimoku: ichimoku[ichimoku.length - 1],
        //     atr: atr[atr.length - 1], aroon: aroon, roc: roc[roc.length - 1], kst: kst[kst.length - 1], obv: obv[obv.length - 1],
        //     mom: mom[mom.length - 1], hafltrend: halfTrend[halfTrend.length - 1], ao: ao[ao.length - 1], chainking: chainking[chainking.length - 1]
        // })
    })
}
async function getData(symbol, time) {
    return new Promise((resolve, reject) => {
        try {
            binance.candlesticks(symbol, time, (error, ticks, symbol) => {
                if (error) {
                    // console.log(error)
                    reject(error)
                } else {
                    if (ticks) {
                        let lastClose = []
                        ticks.forEach(i => {
                            let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = i;
                            lastClose.push(close)
                        })
                        let last_tick = ticks[ticks.length - 1]
                        resolve({
                            "name": symbol,
                            "time": time,
                            "last_tick": last_tick,
                            "ticks": [...ticks]
                        })
                    } else {
                        resolve(null)
                        reject(error)
                    }

                }
            }, { limit: 1000 })
        }
        catch (err) {
            console.log('**** fetch error - limit IP')
            // console.log(err)
            reject(err)
        }

    }).catch((err) => {
        // console.log(err)
    });
}
async function handleData(symbol, time) {
    return new Promise(async (resolve, reject) => {
        let data = await getData(symbol, time);
        if (data) {
            let dataIndicator = await getIndicator(data.ticks, symbol, time);
            let insertData = await oneInsert(dataIndicator)
            resolve(insertData)
        } else {
            resolve(null)
        }

    })
    //calc and push to db
}

async function getFuturePrice(timeframe) {
    let listSupportFromDB = formatListSupportJSONResult(await db.symbolSupport.find({ type: 'future' }))
    let listPair = listSupportFromDB[0].symbol

    let listSymbolVol = [];
    //check
    binance.futuresDaily().then(data => {
        let _listPair = []
        data = Object.entries(data);
        let volumeMin = 10000000 * 3;//min volume
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < listPair.length; j++) {
                if (data[i][1].symbol === listPair[j].symbol) {
                    let vol = parseFloat(data[i][1].quoteVolume)
                    if (vol >= volumeMin) {
                        _listPair.push({ symbol: data[i][1].symbol })
                    }
                }
            }
        }
        _listPair = [{ symbol: 'CHZUSDT' }]
        console.log(_listPair.length)
        let TokenList = []
        console.log('===========================')
        _listPair.forEach(i => {
            TokenList.push(handleData(i.symbol, timeframe));
        })
        Promise.all(TokenList).then(data => {
            console.log('done')
            setTimeout(() => {
                getFuturePrice('15m')
            }, 1000 * 30)
        })
    })

}
function main() {
    getListBinanceSupport();
    getFuturePrice('15m')
}
main();
app.listen(port, () => {
    console.log(`Price app listening on port ${port}`)
})
