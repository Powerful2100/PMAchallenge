const express = require('express')
const app = express()
const port = 3000
const store = require('store2')
const Decimal = require('decimal.js')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

store('wallets', [])
store('tx', [])

var id = 0

function getTodayBalanceChange(id) {
    let date = new Date()
    let y = date.getFullYear()
    let m = date.getMonth()
    let d = date.getDate()
    let todayStart = new Date(y, m, d).getTime()

    let tx = store('tx')

    let todayBalanceChange = new Decimal(0)
    for (t of tx) {
        if (t.timestamp < todayStart) break
        if (t.to === id) todayBalanceChange = todayBalanceChange.plus(t.amount)
        if (t.from === id) todayBalanceChange = todayBalanceChange.minus(t.amount)
    }

    return todayBalanceChange
}

app.post('/wallet', (req, res) => {
    let { name, currency, initialBalance } = req.body

    if (name.length === 0) {
        let error = 'name is empty'
        console.log('wallet creation failure', error)
        return res.json({ error })
    }

    if (currency !== 'ETH') {
        let error = 'this currency is not supported at the moment'
        console.log('wallet creation failure', error)
        return res.json({ error })
    }

    try {
        initialBalance = new Decimal(initialBalance)
    } catch (e) {
        let error = 'initialBalance decimal error'
        console.log('wallet creation failure', error)
        return res.json({ error })
    }
    if (!initialBalance.gte(0)) {
        let error = 'initialBalance should be more than 0'
        console.log('wallet creation failure', error)
        return res.json({ error })
    }

    let wallet = {
        id,
        name,
        currency,
        balance: initialBalance
    }

    let wallets = store('wallets')
    store('wallets', [
        {
            ...wallet,
            createdAt: new Date()
        },
        ...wallets
    ])
    console.log('new wallet created', wallet)

    id++

    res.json(wallet)
})

app.get('/wallet/:id', (req, res) => {
    let { id } = req.params
    id = Number(id)
    if (!(id >= 0)) {
        let error = "invalid id"
        console.log(error)
        return res.json({ error })
    }

    let wallets = store('wallets')
    let filtered = wallets.filter(wallet => wallet.id === id)
    if (filtered.length === 0) {
        let error = "this wallet doesn't exist"
        console.log(error)
        return res.json({ error })
    }
    res.json({
        ...filtered[0],
        todayBalanceChange: getTodayBalanceChange(id)
    })
})

app.get('/wallets', (req, res) => {
    let wallets = store('wallets').map(wallet => ({
        ...wallet,
        todayBalanceChange: getTodayBalanceChange(wallet.id)
    }))

    res.json({ wallets })
})

app.post('/tx', (req, res) => {
    let { from, to, amount, currency } = req.body
    
    from = Number(from)
    if (!(from >= 0)) {
        let error = `invalid 'from' property`
        console.log('tx failure', error)
        return res.json({ error })
    }

    to = Number(to)
    if (!(to >= 0)) {
        let error = `invalid 'to' property`
        console.log('tx failure', error)
        return res.json({ error })
    }

    if (from === to) {
        let error = `same 'from' and 'to'`
        console.log('tx failure', error)
        return res.json({ error })
    }

    let wallets = store('wallets')

    let fromWallet = wallets.filter(wallet => wallet.id === from)
    if (fromWallet.length === 0) {
        let error = `'from' wallet doesn't exist`
        console.log('tx failure', error)
        return res.json({ error })
    }
    fromWallet = fromWallet[0]
    if (new Decimal(0).equals(fromWallet.balance)) {
        let error = `no balance in 'from' wallet`
        console.log('tx failure', error)
        return res.json({ error })
    }

    let toWallet = wallets.filter(wallet => wallet.id === to)
    if (toWallet.length === 0) {
        let error = `'to' wallet doesn't exist`
        console.log('tx failure', error)
        return res.json({ error })
    }
    toWallet = toWallet[0]

    try {
        amount = new Decimal(amount)
    } catch (e) {
        let error = 'amount decimal error'
        console.log('tx failure', error)
        return res.json({ error })
    }
    if (!amount.gt(0)) {
        let error = 'amount should be greater than 0'
        console.log('tx failure', error)
        return res.json({ error })
    }

    if (amount.gt(fromWallet.balance)) {
        let error = `amount is out of balance in 'from' wallet`
        console.log('tx failure', error)
        return res.json({ error })
    }

    if (currency !== 'ETH') {
        let error = `this currency is not supported at the moment`
        console.log('tx failure', error)
        return res.json({ error })
    }

    fromWallet.balance = Decimal.sub(fromWallet.balance, amount)
    toWallet.balance = Decimal.add(toWallet.balance, amount)
    store('wallets', wallets)
    console.log('tx success', `${amount}${currency} moved from #${fromWallet.id}-${fromWallet.name} to #${toWallet.id}-${toWallet.name}`)

    let tx = store('tx')
    let t = {
        from,
        to,
        amount,
        currency,
        timestamp: new Date().getTime()
    }
    store('tx', [
        t,
        ...tx
    ])

    res.json(t)
})

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
