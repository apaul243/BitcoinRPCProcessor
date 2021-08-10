BITCOIN BLOCK READER

This application has been designed to read bitcoin blockdata by calling bitcoind’s rpc call `listsinceblock`. Bitcoin deposits are usually gathered  by calling the bitcoin rpc method and processing the returned data for valid deposits. Application has been tested with 2 files that represent that were gathered through two separate calls to the API. Overall, this is a POC but design has been made in such a way that scaling can be easy by simply setting up a cron/schedulre to perform the RPC call every 'x' seconds


HOW TO RUN : 

-- Just enter one command: sudo docker-compose up --build.
-- Let the container startup and wait for 15-20 seconds.
-- Results will be displayed (user, no of transactions, balance) at the end of the console.

DESIGN

-- This is a node.js application with an embedded mySQL database
-- Code is very sleek and compact, only 120 lines and it does a lot of things like: 

1) Creating separate customer and transaction tables.
2) Extracting records from customer and transaction files
3) Stores records in respective tables.
4) Uses UPSERT feature to avoid duplicate txs or update existing ones
5) Performs business logic to detect valid transactions ( i.e : confirmations >5, receive or generate txs, valid blocks etc.)

SCALING THIS APPLICATION

This project can be treated more of a POC, but it has the capability to be scaled more. Here are some recommended features for a full-scale prod quality application

-- Right now data is being fed from files, but code can easily have a scheduler (or job) which automatically executes a RPC call to the bitcoin api listsinceblock at certian interval
-- MySQL can be an excellent database considering the size and types of data. The current model(customer, txdata) can be expanded to include more source and even cryptos.
-- It would be ideal to gather bitcoin block data from multiple sources instead of just RPC call.

