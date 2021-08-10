'use strict';
var mysql = require('mysql');
const fs = require('fs'); 

 var mysqlHost = process.env.MYSQL_HOST || 'localhost';
 var mysqlPort = process.env.MYSQL_PORT || '3306';
 var mysqlUser =  'root';
 var mysqlPass =  'root';
 var mysqlDB   = process.env.MYSQL_DB   || 'node_db';

setTimeout(() => main(),15000);

function dbConnection() {
	
	let connection = mysql.createConnection({
		host: mysqlHost,
		port: mysqlPort,
		user: mysqlUser,
		password: mysqlPass,
		database: mysqlDB,
		multipleStatements: true
	});
	connection.connect(function(e) {   // Connect with the database
	if (e) {
		return console.error('error: ' + e.message);   	// Show error messaage on failure
	}
	console.log('\nConnected to the MySQL server...\n');  // Show success message if connected
	});
	return connection;
}


function main() {
	var connection = dbConnection();
	createTables(connection);
	processTxFile('transactions-1.json',connection);
	processTxFile('transactions-2.json',connection);
	loadUserData('customers.json',connection);
	getAllUserBalances(connection);
	remTasks(connection);
	connection.end();
}

function createTables(connection){

var sql1 = "CREATE TABLE bcdata (involvesWatchonly VARCHAR(255), account VARCHAR(255), address VARCHAR(255), category VARCHAR(255), amount DOUBLE, label VARCHAR(255), confirmations INT, blockhash VARCHAR(255), blockindex INT, blocktime BIGINT,  txid VARCHAR(255) NOT NULL,vout INT, time BIGINT, timeReceived BIGINT, PRIMARY KEY(txid)); CREATE TABLE customers (customer VARCHAR(255), address VARCHAR(255))";  
connection.query(sql1, function (err, result) {  
if (err) throw err;  
console.log("Tables created");  
});  
}

function processTxFile(path,connection) {
	let rawdata = fs.readFileSync(path);
	let txdata = JSON.parse(rawdata);
	let txs = txdata.transactions;
	
	for(let i=0; i <txs.length; i++) {
		var sql = "REPLACE INTO `moe_db`.`bcdata` (`involvesWatchonly`,`account`,`address`,`category`,`amount`,`label`,`confirmations`,`blockhash`,`blockindex`,`blocktime`,`txid`,`vout`,`time`,`timeReceived`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
		connection.query(sql, [txs[i].involvesWatchonly,txs[i].account,txs[i].address,txs[i].category,txs[i].amount,txs[i].label,txs[i].confirmations,txs[i].blockhash,txs[i].blockindex,txs[i].blocktime,txs[i].txid,txs[i].vout,txs[i].time,txs[i].timeReceived],function (err, result) {  
		if (err) throw err;  
				console.log("Rows Inserted");  
		});
		
	}
	
}	

function loadUserData(path,connection){
	
	let rawdata = fs.readFileSync(path);
	let customers = JSON.parse(rawdata);
	
		for(let i=0; i <customers.length; i++) {
		var sql = " REPLACE INTO `moe_db`.`customers` (`customer`,`address`) VALUES (?,?); ";
		connection.query(sql, [customers[i].name,customers[i].account],function (err, result) {  
		if (err) throw err;  
				console.log("Rows Inserted");  
		});
		
	}
	
}	



function getAllUserBalances(connection) {
		
		var sql = " select t.customer,sum(t.amt) as sum,count(*) as cnt from (SELECT cust.customer, cust.address,bcdata.txid,bcdata.amount as amt FROM moe_db.customers as cust JOIN moe_db.bcdata as bcdata on cust.address=bcdata.address where (bcdata.confirmations > 5 and bcdata.category in ('receive')) OR  (bcdata.confirmations > 100 and bcdata.category in ('generate')) order by cust.customer) AS t group by t.customer;SELECT SUM(T.amount) AS tsum, COUNT(*) AS cnt FROM (SELECT AMOUNT FROM moe_db.bcdata where (bcdata.confirmations > 5 and bcdata.category in ('receive')) OR  (bcdata.confirmations > 100 and bcdata.category in ('generate')))AS T";
		connection.query(sql, function (err, results) {  
		if (err) throw err; 
				var sumAmounts =0;
				var totalcount=0;
				var result3 = results[1][0];

				var result = results[0];
				for(let q=0; q<result.length;q++) {
					sumAmounts = sumAmounts+result[q].sum;
					totalcount=totalcount+result[q].cnt;
					console.log("Deposited for " + result[q].customer + ": count=" + result[q].cnt + " sum=" + result[q].sum);
				}
				var sumOtherAmounts = result3.tsum - sumAmounts;
				var countOtherAmounts = result3.cnt - totalcount; 
				console.log("Deposited without reference: count=" + countOtherAmounts + " sum=" + sumOtherAmounts);
		});
		
}

function remTasks(connection){
	
	/*	var sql = " ";
		connection.query(sql, function (err, result) {  
		if (err) throw err; 
			console.log();
		}); */
		
		var sql = " select max(amount) as max,min(amount) as min  from moe_db.bcdata as bcdata where (bcdata.confirmations > 5 and bcdata.category in ('receive')) OR 	(bcdata.confirmations > 100 and bcdata.category in ('generate'));";
		connection.query(sql, function (err, result) {  
		if (err) throw err; 
			console.log("Smallest valid deposit: " + result[0].min);
			console.log("Largest valid deposit: " + result[0].max);
		});	
}	

