# Tech challenge
You need to build a very basic backend API for a bank, the requirement is to support a REST API with the following 4 endpoints:

### Endpoint #1:
```
POST /wallet
Request (you are free to chose the types):
{ 
	"name"
  "currency":"ETH" // ETH is the only currency supported at the moment
	"initialBalance"
}
Response:
{
	"id",
 	"name",
	"currency" "ETH",
	"balance":
}
```

### Endpoint #2:
```
GET /wallet/:id
Response (you are free to chose the types):
{
	"id"
  "name"
  "currency":"ETH"
  "balance":
  "todayBalanceChange"
	"createdAt"
}
```
### Endpoint #3:
Don’t worry about pagination but make sure the returned order is by `createdAt` with the most recent created wallet being first and the least recent last.
```
GET /wallets
Reponse:
{
	"wallets": { "id", "name", "currency", "balance", "todayBalanceChange", "createdAt" }[]
}
```

### Endpoint #4
```
POST /tx
Request:
{
  "from": the id of the from wallet (make sure the wallet has balance, otherwise fail tx)
  "to": the id of the wallet to
  "amount": the amount
	"currency": "ETH"
}
```

## Description
The main requirement of this banking app is to keep track of the wallet balances. 
Users need to create wallets with some `initialBalance` in order to be able to move funds later.

So, a typical use case would be:
1. Create a wallet named `wallet_1` with `initialBalance` of `2.03 ETH`
2. Create a wallet named `wallet_2` with `initialBalance` of `0 ETH`
3. Send a tx from `wallet_1` to `wallet_2` of `0.01 ETH`
4. Send a tx from `wallet_2` to `wallet_1` of `0.005 ETH`
5. Send a tx from `wallet_1` to `wallet_2` of `0.02 ETH`
6. Get all wallets (with endpoint #3): and the result should have the appropriate balances & todayBalanceChange:
	- Wallet 1:
```
balance: 2.005
todayBalanceChange: -0.025 (initialBalance should be ignored for this calculation)
```
	- Wallet 2:
```
balance: 0.025
todayBalanceChange: 0.025 (initialBalance should be ignored for this calculation)
```

### Note about `todayBalanceChange`:
I’de like to know how much the balance amount changed during the current day, so imagine today I had so far 3 txs:
1. Outgoing 1.003 ETH
2. Incoming 0.2 ETH 
3. Outgoing: 0.1 ETH
Then the `todayBalanceChange` should be `- 0.903 ETH`

### Note about storage
You can store all the necessary wallet and tx data to support the endpoints in-memory or you can store it in any DB you feel comfortable with, if you decide on DB then make sure it is easy to start the application: use docker with docker compose.
- - - -

Let me know any questions. Thank you very much for taking the time to do this challenge!
