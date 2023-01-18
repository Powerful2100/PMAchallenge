const express = require('express')
const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const store = require('store2')
store('wallets', [])
store('tx', [])

var id = 0

function getTodayBalanceChange(id) {
    let date = new Date()
    let y = date.getFullYear()
    let m = date.getMonth()
    let d = date.getDate()
    let todayStart = new Date(y, m, d, 0, 0, 0, 0).getTime()

    let tx = store('tx')

    let todayBalanceChange = 0
    for (t of tx) {
        if (t.timestamp < todayStart) break
        if (t.to === id) todayBalanceChange += t.amount
        if (t.from === id) todayBalanceChange -= t.amount
    }

    return todayBalanceChange
}

app.post('/wallet', (req, res) => {
    let { name, currency, initialBalance } = req.body

    if (name.length === 0) {
        return res.json({ error: 'name is empty' })
    }

    if (currency !== 'ETH') {
        return res.json({ error: 'this currency is not supported at the moment' })
    }

    initialBalance = Number(initialBalance)
    if (!(initialBalance >= 0)) {
        return res.json({ error: 'initialBalance should be a number greater than 0' })
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
    console.log('new wallet added', wallet)

    id++

    res.json(wallet)
})

app.get('/wallet/:id', (req, res) => {
    let { id } = req.params
    let wallets = store('wallets')
    let filtered = wallets.filter(wallet => wallet.id === Number(id))
    if (filtered.length === 0) {
        return res.json({
            error: "this wallet no exist"
        })
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
        return res.json({ error: `tx failure: invalid 'from' property` })
    }

    to = Number(to)
    if (!(to >= 0)) {
        return res.json({ error: `tx failure: invalid 'to' property` })
    }

    if (from === to) {
        return res.json({ error: `tx failure: same 'from' and 'to'` })
    }

    let wallets = store('wallets')

    let fromWallet = wallets.filter(wallet => wallet.id === from)
    if (fromWallet.length === 0) {
        return res.json({ error: `tx failure: no exist from wallet` })
    }
    fromWallet = fromWallet[0]
    if (fromWallet.balance === 0) {
        return res.json({ error: `tx failure: no balance in from wallet` })
    }
    if (fromWallet.balance < amount) {
        return res.json({ error: `tx failure: amount is out of balance in from wallet` })
    }

    let toWallet = wallets.filter(wallet => wallet.id === to)
    if (toWallet.length === 0) {
        return res.json({ error: `tx failure: no exist to wallet` })
    }
    toWallet = toWallet[0]

    amount = Number(amount)
    if (!(amount >= 0)) {
        return res.json({ error: 'amount should be a number greater than 0' })
    }

    if (currency !== 'ETH') {
        return res.json({ error: 'this currency is not supported at the moment' })
    }

    fromWallet.balance -= amount
    toWallet.balance += amount
    store('wallets', wallets)
    console.log("tx success", `${amount}${currency} moved from #${fromWallet.id}-${fromWallet.name} to #${toWallet.id}-${toWallet.name}`)

    let tx = store('tx')
    store('tx', [
        {
            from,
            to,
            amount,
            currency,
            timestamp: new Date().getTime()
        },
        ...tx
    ])
})

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
