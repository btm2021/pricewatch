const express = require('express')
const app = express()
const port = 3000
const moment = require('moment')
const request = require('request')
var wsClientList = [];
var fs = require('fs')
var compression = require('compression')
const cors = require('cors')
const enableWs = require('express-ws')
var bodyParser = require('body-parser')
var exchangeInfo = null;
var logMessage = new Map()
var count = 1;
var listSymbolUse = []
countMain = 1;
enableWs(app)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3030 });
const clients = new Map();
wss.on('connection', (ws) => {
    console.log('client connect')
    const id = uuidv4();
    clients.set(ws, id);

    ws.on("message", (messageAsString) => {
        [...clients.keys()].forEach((client) => {
            client.send('hello');
        });
    })
    ws.on("close", () => {
        clients.delete(ws);
    });
})
app.use(compression())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.ws('/ws', (ws, req) => {
    wsClientList.push(ws);
    ws.on('message', msg => {
        sendMessageToWS("hello")
    })
    ws.on('close', () => {
        wsClientList = wsClientList.filter(item => { item === ws })
        console.log('WebSocket was closed')
    })
})
app.get('/', (req, res) => {
    res.send({ hello: "world" })
})
app.get('/p', (req, res) => {
    res.sendFile(__dirname + '/p.html');
})

app.get('/plot', (req, res) => {
    res.sendFile(__dirname + '/plot.html');
})
app.get('/backtest', (req, res) => {
    res.sendFile(__dirname + '/backtest.html');
})
app.get('/bb', (req, res) => {

    const fs = require("fs");
    fs.readFile("./aaa.json", 'utf8', (err, data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
    })
})
app.get('/backtest_getconfig', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(IndicatorConfig)
})
app.get('/getOne', (req, res) => {
    let { name, type, timeframe } = req.query
    let fileName = `${type}_${name}_${timeframe}.json`
    fs.readFile(fileName, 'utf8', (err, data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
    })
})
app.get('/getAll', (req, res) => {
    priceDB.find({}).then(data => {
        res.send(data)
    })
})
app.get('/getLog', (req, res) => {
    res.send(Object.fromEntries(logMessage))
})
app.get('/listSupport', (req, res) => {
    let { type } = req.query
    db.symbolSupport.find({ type }).then(data => {
        res.send(formatListSupportJSONResult(data))
    })
})
app.post('/configmybot', (req, res) => {
    let { noti, emaPeriod, spPeriod, spMul, psarMaxCount, psarStep, psarMax, minVol, levager, minROE } = req.body
    IndicatorConfig.noti = noti
    IndicatorConfig.minVolume = minVol
    IndicatorConfig.signal.emaPeriod = emaPeriod
    IndicatorConfig.signal.spPeriod = spPeriod
    IndicatorConfig.signal.spMul = spMul
    IndicatorConfig.signal.psarMax = psarMax
    IndicatorConfig.signal.psarMaxCount = psarMaxCount
    IndicatorConfig.signal.psarStep = psarStep
    IndicatorConfig.levager = levager
    IndicatorConfig.minROE = minROE
})
app.get('/listsymbolsupport', (req, res) => {
    res.send(listSymbolUse)
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
    //   console.log('database connected')
})

function sendNotification(msg) {
    IndicatorConfig.noti.map(item => {
        let url = `https://pushnotify.co.uk/send/?userid=${item.userid}&code=${item.code}&txt=${msg}`
        request(url, (error, response, body) => {
            console.log('send msg to ' + item.userid + ' done!!1')
        })
    })
}
async function oneInsert(data) {
    return new Promise((resolve, reject) => {
        let { name, timeframe, time, type, priceList } = data;
        priceDB.findAndModify({
            query: { name, timeframe, type },
            update: { $set: { name, time, type, priceList } },
            upsert: true,
        }).then(data => {
            resolve(data)
        }).catch(err => {
            reject(err)
        });
    })
}
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
//*binance
const Binance = require('node-binance-api');
const binance = new Binance({
    recvWindow: 60000, // Set a higher recvWindow to increase response timeout
})
var IndicatorConfig = {
    ListBANSymbol: ['1000', '_', 'LUNA2', 'FOOT'],
    noti: [{ userid: 'baotm', code: 726624 }],
    signal: {
        emaPeriod: 20,
        spPeriod: 13,
        spMul: 3,
        psarMaxCount: 4,
        psarStep: 0.02,
        psarMax: 0.02
    },
    minVolume: 2,
    levager: 20,
    minROE: 30,
    volumeSensor: 3,
    timeOut: 25,
    timeframe: '15m',
    countAlert: 5,
}
function sendMessageToWS(msg) {
    //
    [...clients.keys()].forEach((client) => {
        client.send(JSON.stringify(msg));
    });
    wsClientList.forEach((ws) => {
        ws.send(JSON.stringify(msg))
    })
    sendNotification(msg.msg)
}

function getSignal(d1, d2) {
    //d1: ema
    //d2: trail2
    d1.splice(0, d1.length - d2.length);
    var cross = (d1[0] > d2[0]), indexes = [];
    for (var i = 0; i < d1.length; i++) {
        if (d1[i] < d2[i] && cross) {
            indexes.push({ index: i, cross: false, signal: 'SHORT' });
            cross = false;
        }
        if (d1[i] > d2[i] && !cross) {
            indexes.push({ index: i, cross: true, signal: 'LONG' });
            cross = true;
        }
    }

    return indexes;
}

function mybot1(dataClose, dataFull, name, timeframe) {
    let period = 14
    const EMA = require('technicalindicators').EMA
    let ema14 = EMA.calculate({ period, values: dataClose })
    let t2 = Array(ema14.length)
    for (let i = 1; i < ema14.length - 1; i++) {
        let t1 = ema14[i]
        let sl = t1 * 0.02
        let iff1 = (t1 > nz(t2[i - 1])) ? t1 - sl : t1 + sl
        let iff2 = (t1 < nz(t2[i - 1]) && ema14[i - 1] < nz(t2[i - 1])) ? Math.min(nz(t2[i - 1]), t1 + sl) : iff1
        let iff3 = (t1 > nz(t2[i - 1]) && ema14[i - 1] > nz(t2[i - 1])) ? Math.max(nz(t2[i - 1]), t1 - sl) : iff2
        t2[i] = iff3
    }
    let t1 = ema14;
    for (let i = 0; i < period - 1; i++) {
        t2[i] = 0;
        t1.unshift(0)
        t2.unshift(0)
    }
    let signal = getSignal(t1, t2)
    let lastSignal = signal[signal.length - 1]
    if ((dataClose.length - lastSignal.index) <= IndicatorConfig.countAlert) {
        //trong v??ng 5 c??y th?? b??o

        let currentSignal = lastSignal;
        let entryPrice = formatPrice(((dataFull[currentSignal.index].close + dataFull[currentSignal.index].low) / 2), name)
        let slPrice = formatPrice(t2[currentSignal.index + 1], name)
        let tpPrice = getTP(currentSignal.signal, entryPrice, name)
        let time = moment(dataFull[currentSignal.index].time).format('DD-MM HH:mm')
        let msg = `${time} ${currentSignal.signal} ${name} ${timeframe} Entry:${entryPrice} TP:${tpPrice} SL:${slPrice}`
        sendMessageToWS({
            cataloge: 'bot',
            type: 'alert',
            msg
        })
    }

    let fullData = []
    dataFull.map((i, index) => {
        let isSignal = signal.find(i => i.index === index)
        let _signal = null;
        if (isSignal) {
            _signal = isSignal
            _signal.entry = (dataFull[index].close + dataFull[index].low) / 2
            _signal.sl = t2[index + 1]
            _signal.tp = 1;
        }
        fullData.push({
            ...dataFull[index], t1: t1[index], t2: t2[index], signal: _signal
        })
    })
    let fileName = `future_${name}_${timeframe}.json`
    fs.writeFile(fileName, JSON.stringify(fullData), function (err) {
        if (err) {
            return console.log(err);
        } else {
            console.log(`Write ${fileName} done!`)
        }
    });

}

function formatPrice(price, name) {
    let symbolInfo = exchangeInfo.find(i => i.symbol === name)

    if (symbolInfo) {
        let pricePrecision = symbolInfo.pricePrecision
        return parseFloat(String(price.toFixed(pricePrecision)))
    } else {
        console.log('write fail at ' + name)
        return price;
    }
}
function getTP(side, entryPrice, name) {
    //Takeprofit = 30% ROE x25
    let levager = IndicatorConfig.levager
    let minROE = IndicatorConfig.minROE
    //calc minROE
    /*
    Gi?? m???c ti??u Long = gi?? v??o l???nh * (ROE%/????n b???y + 1)
    Gi?? m???c ti??u Short = gi?? v??o l???nh * (1 - ROE%/????n b???y)
    */
    let tpPrice = 0;
    if (side === "LONG") {
        tpPrice = entryPrice * ((minROE / 100) / levager + 1)
    } else {
        tpPrice = entryPrice * (1 - (minROE / 100) / levager)
    }
    return formatPrice(tpPrice, name);

}
function nz(val) {
    if (!val) {
        return 0
    } else {
        return val
    }
}
// function mybot(data, name, timeframe, dataSuperTrend) {
//     //* t??nh psar
//     let high = []
//     let low = []
//     let dataClosePSAR = []

//     data.map(item => {
//         dataClosePSAR.push(item.close)
//         high.push(item.high)
//         low.push(item.low)
//     })
//     let step = IndicatorConfig.signal.psarStep
//     let max = IndicatorConfig.signal.psarMax

//     let PSAR = require('technicalindicators').PSAR;
//     let _psar = PSAR.calculate({ high, low, step, max })
//     //check _psar change, ki???m tra gi?? psar c??y tr?????c ????, n???u c??y tr?????c ???? ??ang n???m d?????i gi?? m?? c??y hi???n t???i tr??n gi?? th?? g???i l?? 
//     //chuy???n chuy???n trend t??? up sang down
//     let __psar = []
//     let barCount = 1;
//     for (let i = 1; i < _psar.length; i++) {
//         let lastPsar = _psar[i - 1]
//         let currentPsar = _psar[i]
//         let lastClose = dataClosePSAR[i - 1]
//         let currentClose = dataClosePSAR[i]
//         let lastTrend = (lastClose > lastPsar) ? 1 : -1
//         let currentTrend = (currentClose > currentPsar) ? 1 : -1
//         if (lastTrend != currentTrend) {
//             __psar.push({
//                 psar: currentPsar,
//                 trend: currentTrend,
//                 isStartTrend: true,
//                 index: i,
//                 close: currentClose,
//                 barCount: 1
//             })
//             barCount = 1;
//         } else {
//             __psar.push({
//                 psar: currentPsar,
//                 trend: currentTrend,
//                 isStartTrend: false,
//                 index: i,
//                 close: currentClose,
//                 barCount
//             })
//             barCount++;
//         }
//     }
//     __psar.unshift(0)
//     //* t??nh ema14,
//     let st = superTrend(dataSuperTrend, IndicatorConfig.signal.spPeriod, IndicatorConfig.signal.spMul, name, timeframe)
//     const EMA = require('technicalindicators').EMA
//     let period = IndicatorConfig.signal.emaPeriod;
//     let dataClose = []
//     data.map(item => {
//         dataClose.push((item.high + item.low) / 2)
//     })
//     let ema10 = EMA.calculate({ period: period, values: dataClose })
//     let ema50 = EMA.calculate({ period: 100, values: dataClose })

//     for (let i = 0; i < period - 1; i++) {
//         ema10.unshift(0)
//     }
//     for (let i = 0; i < 100 - 1; i++) {
//         ema50.unshift(0)
//     }

//     let signal = []
//     for (let i = 1; i < st.length - 1; i++) {
//         if (st[i].Supertrend.Direction != st[i - 1].Supertrend.Direction) {
//             signal.push({
//                 index: i,
//                 st: st[i]
//             });
//         }
//     }
//     let result = []
//     data.map((item, index) => {
//         let _st = {
//             Direction: (st[index].Supertrend.Direction) ? 0 : 1,
//             Up: (st[index].Supertrend.Up) ? st[index].Supertrend.Up : 0,
//             Down: (st[index].Supertrend.Down) ? st[index].Supertrend.Down : 0,
//             ActiveTrend: (st[index].Supertrend.ActiveTrend) ? st[index].Supertrend.ActiveTrend : 0,
//         }
//         //l???c t??n hi???u nhi???u

//         let _signal = signal.find(i => i.index === index)
//         if (_signal) {
//             //ki???m tra ema hi???n t???i
//             let emaCurrent = ema10[index]
//             let spCurrent = _signal.st.Supertrend
//             let close = data[index].close
//             let high = data[index].high
//             let low = data[index].low
//             let barTime = moment(data[index].time).format('DD/MM HH:mm ')
//             let rawTime = data[index].time
//             let side = (_signal.st.Supertrend.Direction > 0) ? "LONG" : "SHORT"

//             //check supertrend tr?????c c??ng trend th?? b??? qua
//             //l???y index trend hi???n t???i
//             let _indexCurrentSp = signal.findIndex(i => i.index === index)
//             let psarCurrent = __psar[index]
//             //n???u b???t ?????u superTrend v?? __psar count c??ng chi???u 
//             let psarSide = (psarCurrent.trend > 0) ? "LONG" : "SHORT";
//             //check psar, n???u psar trong chu k?? hi???n t???i ho???c trong 4 chu k?? tr?????c c??ng chi???u th?? v??o l???nh
//             if (side === "LONG" && close > emaCurrent && psarSide === "LONG" && psarCurrent.barCount < IndicatorConfig.signal.psarMaxCount) {

//                 if (_indexCurrentSp != 0) {
//                     //l???y suppertrend tr?????c
//                     let preSp = signal[_indexCurrentSp - 1]
//                     //l???y ra h?????ng
//                     let Dicrection = preSp.st.Supertrend.Direction;
//                     //ki???m tra v???i sp hi???n t???i,n???u gi???ng th?? b??? qua hi???n t???i
//                     if (Dicrection === spCurrent.Dicrection) {
//                         _signal = 0
//                     } else {

//                         _signal = _signal.st.Supertrend
//                         _signal.entryOrder = {
//                             name,
//                             side,
//                             entryPrice: formatPrice((high + low) / 2, name),//entryPrice = high+close /2
//                             tpPrice: getTP(side, (high + low) / 2, name),
//                             slPrice: formatPrice(spCurrent.ActiveTrend, name),
//                             barTime, rawTime
//                         }

//                     }
//                 }

//             } else if (side === "SHORT" && close < emaCurrent && psarSide === "SHORT" && psarCurrent.barCount < IndicatorConfig.signal.psarMaxCount) {
//                 if (_indexCurrentSp != 0) {
//                     //l???y suppertrend tr?????c
//                     let preSp = signal[_indexCurrentSp - 1]
//                     //l???y ra h?????ng
//                     let Dicrection = preSp.st.Supertrend.Direction;
//                     //ki???m tra v???i sp hi???n t???i,n???u gi???ng th?? b??? qua hi???n t???i
//                     if (Dicrection === spCurrent.Dicrection) {
//                         _signal = 0
//                     } else {
//                         _signal = _signal.st.Supertrend
//                         _signal.entryOrder = {
//                             name,
//                             side,
//                             entryPrice: (high + low) / 2,//entryPrice = high+close /2
//                             tpPrice: getTP(side, (high + low) / 2, name),
//                             slPrice: spCurrent.ActiveTrend,
//                             barTime, rawTime
//                         }
//                     }
//                 }
//             } else {
//                 _signal = 0
//             }
//         } else {
//             _signal = 0
//         }
//         result.push({ ...item, st: _st, ema10: ema10[index], ema50: ema50[index], signal: _signal, psar: __psar[index] })
//     })
//     //ghi l??n db 
//     //Ki???m tra lastSignal
//     let currentSignal = result[result.length - 2].signal;
//     //*test
//     // currentSignal = result.filter(i => i.signal != 0)
//     // currentSignal = currentSignal[currentSignal.length - 1]
//     // currentSignal = currentSignal.signal
//     //end test
//     if (currentSignal != 0) {
//         let { name, side, entryPrice, tpPrice, slPrice, barTime } = currentSignal.entryOrder
//         let msg = `${ barTime } ${ side } ${ name } Entry:${ entryPrice } TP:${ tpPrice } SL:${ slPrice } `
//         sendMessageToWS({
//             cataloge: 'bot',
//             type: 'alert',
//             msg
//         })
//         let uniqueName = `${ name }_${ timeframe }_${ side }_${ barTime } `
//         logMessage.set(uniqueName,
//             {
//                 signal: currentSignal,
//                 msg
//             })
//     }
//     let fileName = `future_${ name }_${ timeframe }.json`
//     fs.writeFile(fileName, JSON.stringify(result), function (err) {
//         if (err) {
//             return console.log(err);
//         }
//         console.log(`[${ countMain }][${ count }]  ${ new Date() } ${ fileName } write  ${ name } complete `);
//         count++;
//     });

//     //send to db

// }
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

        mybot1(dataClose, dataFull, name, timeframe);
        //1. volume cao x2

        //sendMessageToWS(msg)

        let volumeLast = dataCloseVolume[dataCloseVolume.length - 2][1];
        let volumeCurrent = dataCloseVolume[dataCloseVolume.length - 1][1];
        if (volumeCurrent >= volumeLast * IndicatorConfig.volumeSensor) {
            //c?? s??? b??m
            //ki???m tra trong alertList c?? symbol ch??a
            let sym = alertList.findIndex(i => { i.name === name && i.timeframe === timeframe })
            if (sym > 0) {
                //c??, l???y count v?? t??ng l??n 1
                var a = alertList[sym].count;
                if (a < 5) {
                    alertList[sym].count += 1;
                    let msg = {
                        cataloge: 'volume',
                        type: 'alert',
                        message: `Symbol ${name} Volume c?? s??? gia t??ng volume, gi?? tr?????c ${dataCloseVolume[dataCloseVolume.length - 2][0]} gi?? hi???n t???i ${dataCloseVolume[dataCloseVolume.length - 2][0]}, volume c?? ${volumeLast}, volume m???i${volumeCurrent} t??ng g???p ${(volumeCurrent / volumeCurrent).toFixed(1)} l???n`
                    }
                    sendMessageToWS(msg)
                }

            } {
                //kh??ng t???o m???i 1 alertList
                alertList.push({
                    name, timeframe, count: 0
                })
            }
            //t??m ra count, n???u count >5 ko g???i n???a
        } else {
            //reset count
            alertList = alertList.filter(i => { i.name !== name && i.timeframe !== timeframe })
        }
        let time = (new Date()).valueOf();
        resolve({
            name, timeframe, time, type: 'future',
        })

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
            })
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
            //   let insertData = await oneInsert(dataIndicator)
            resolve('ok')
        } else {
            resolve(null)
        }

    })
    //calc and push to db
}

async function getFuturePrice(timeframe) {
    countMain++;
    binance.futuresExchangeInfo().then(rawFuturesExchangeInfo => {
        if (rawFuturesExchangeInfo) {
            count = 1;
            let listAsset = rawFuturesExchangeInfo.symbols;
            let listSymbolNotIncluceBUSD = listAsset.filter(pair => {

                return (!IndicatorConfig.ListBANSymbol.includes(pair.symbol) && !(pair.symbol.includes("BUSD")) && !(pair.symbol.includes("_")))
            })
            let listSupport = []
            listSymbolNotIncluceBUSD.map(item => {
                listSupport.push({ symbol: item.symbol, exchangeInfo: item })
            })
            exchangeInfo = listSymbolNotIncluceBUSD
            binance.futuresDaily().then(data => {
                let _listPair = []
                data = Object.entries(data);
                let volumeMin = 10000000 * IndicatorConfig.minVolume;//min volume

                for (let i = 0; i < data.length; i++) {
                    let vol = parseFloat(data[i][1].quoteVolume)
                    //b??? 1 s??? con trong list ban
                    let symbol = data[i][1].symbol
                    let isBan = false
                    IndicatorConfig.ListBANSymbol.map(i => {
                        if (symbol.includes(i)) {
                            isBan = true;
                        }
                    })
                    if (vol > volumeMin && !isBan) {
                        _listPair.push({ symbol: data[i][1].symbol })
                    }
                }
                let TokenList = []
                //_listPair = [{ symbol: 'ROSEUSDT' }]
                listSymbolUse = _listPair
                console.log('Begin fetch data. [' + _listPair.length + "]")
                _listPair.forEach(i => {
                    TokenList.push(handleData(i.symbol, timeframe));
                })
                Promise.all(TokenList).then(data => {
                    console.log('===========================')
                    setTimeout(() => {
                        getFuturePrice(IndicatorConfig.timeframe)
                    }, 1000 * IndicatorConfig.timeOut)
                })
            })
        }
    })


}
function main() {
    getFuturePrice(IndicatorConfig.timeframe)
}
main();
app.listen(port, () => {
    console.log(`Price app listening on port ${port} `)
})
