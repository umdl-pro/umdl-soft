'use strict';

var CryptoJS = require("crypto-js");
var express = require("express");
var cors = require("cors");
var WebSocket = require("ws");

var http_port = process.env.HTTP_PORT || 80;
//var http_port = process.env.HTTP_PORT || 80;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

// >>>>>>>>>>>>>>>>>>>>>>> BLOCK RECORD DEF >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
class Block {
    constructor(index, previousHash, timestamp, chainID, keyID, keyVal, fieldID, fieldVal, hash) {
        this.index = index;
        this.previousHash = previousHash.toString();
        this.timestamp = timestamp;
        // >>> data >>>
		this.chainID = chainID;
		this.keyID = keyID;
		this.keyVal = keyVal;
		this.fieldID = fieldID;
		this.fieldVal = fieldVal;
		// <<< data <<<
        this.hash = hash.toString();
    }
}
// <<<<<<<<<<<<<<<<<<<<<<< BLOCK RECORD DEF <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


var sockets = [];
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

var getGenesisBlock = () => {
    return new Block(0, "0", 1465154705, "genesis", "block", "genesis", "block", "genesis", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
};

var blockchain = [getGenesisBlock()];

var initHttpServer = () => {
    var app = express();
    var bodyParser = require('body-parser');
	
	app.use(cors());

	//app.use(bodyParser.json());
	app.set('view engine', 'pug');

	app.set('views','./views');
    
	app.get('/blocks', (req, res) => res.send('{"items": ' + JSON.stringify(blockchain) + '}'));

	app.get('/fi', (req, res) => res.send('{"blockchain": ' + JSON.stringify(blockchain) + '}') );
	
	// >>>>>>>>>>>> TM1 >>>>>>>>>>>    
	//app.get('/tm1', (req, res) => res.redirect('http://offsiteserver.co.uk:8010/api/v1/'));
	// <<<<<<<<<<<< TM1 <<<<<<<<<<<

	app.use(bodyParser.urlencoded({ extended: true }));

    // >>>>>>>>>>>> FOOTBALL INDEX >>>>>>>>>>>
	app.get('/fi1/:selectedPlayer', (req, res) => {
		 
		var Request = require("request");
		
		var playerURL = 'https://api-prod.footballindex.co.uk/v2/timeseries?id=' + req.params.selectedPlayer + '&period=1d&interval=2h';
		
		//Request.get("https://api-prod.footballindex.co.uk/v2/timeseries?id=paul-pogba&period=1d&interval=2h", (error, response, body) => {
		Request.get(playerURL, (error, response, body) => {
			if(error) {
				return console.dir(error);
			}
				res.send(JSON.parse(body));
			});
	});
	
	app.get('/fi2/:selectedPlayer', (req, res) => {
		 
		var Request = require("request");
		
		var playerURL = 'https://api-prod.footballindex.co.uk/v2/timeseries?id=' + req.params.selectedPlayer + '&period=60d&interval=120h';
		
		//Request.get("https://api-prod.footballindex.co.uk/v2/timeseries?id=paul-pogba&period=1d&interval=2h", (error, response, body) => {
		Request.get(playerURL, (error, response, body) => {
			if(error) {
				return console.dir(error);
			}
				res.send(JSON.parse(body));
			});
	});

	app.get('/fibuzz/:selectedDate', (req, res) => {
		
		console.log(req.params.selectedDate);
		
		var Request = require("request");
	
		var buzzURL = 'https://api-buzz.footballindex.co.uk/rankedpage/footballuk.all:' + req.params.selectedDate + '?page=1&per_page=1&sort=asc';
		
		Request.get(buzzURL, (error, response, body) => {
			if(error) {
				return console.dir(error);
			}
				console.log(JSON.parse(body));
				res.send(JSON.parse(body));
			});
	});
		
	
	
	// <<<<<<<<<<<< FOOTBALL INDEX <<<<<<<<<<<

	
	//app.use(bodyParser.urlencoded({ extended: false }));
	//app.use(bodyParser.json())



	// >>>>>>>>>>>>>>>> ADD NEW BLOCK >>>>>>>>>>>>>>>>>

	app.post('/mineBlock', (req, res) => {
	
		console.log(req.body.idata);
		
		var blockArray = req.body['idata'].split(",");
		
		console.log(blockArray[0], blockArray[1]);
		var newBlock = generateNextBlock(blockArray[0],blockArray[1],blockArray[2],blockArray[3],blockArray[4]);
        addBlock(newBlock);
        broadcast(responseLatestMsg());
        console.log('blocky added: ' + JSON.stringify(newBlock));
	    res.send();
    });
	
	// <<<<<<<<<<<<<<<< ADD NEW BLOCK <<<<<<<<<<<<<<<<<<
	
	// >>>>>>>>>>>>>>>> RETURN SPECIFIC BLOCK >>>>>>>>>>>>>>>>>>
	app.get('/blockrec/:keyVal', function (req, res) {
		
		var picked = blockchain.filter(function(r){
			return r["keyVal"] == req.params.keyVal })[0]|| 'No record found';
		
		console.log(req.params.id);
		console.log(picked);
		res.send('{"blockchain": [' + JSON.stringify(picked) + ']}');
		
		//var result = records.filter(function(r) { return r["EmployeeID"] == 4432 })[0]||'No record found';
	});
	
	// <<<<<<<<<<<<<<<< RETURN SPECIFIC BLOCK <<<<<<<<<<<<<<<<<<
	
	
	// - pug example
	app.get('/first_template', function(req, res){
		res.render('first_view', {
			blkc: JSON.stringify(blockchain)
		});
	});
        // - end pug example
 


        

	// file upload
	var formidable = require('formidable');
	var fs = require('fs');

  	app.post('/fileupload', (req, res) => {
		var form = new formidable.IncomingForm();
		form.parse(req, function (err, fields, files) {
			var oldpath = files.filetoupload.path;
			var newpath = 'G:/ServerFolders/BOB/OSS-Showtime/Dev/BC/www/mapsense/engine/zyz_upload_files/' + files.filetoupload.name;
			
			//fs.copy(oldpath, newpath, function (err) {
			//	if (err) throw err;
			
			// copy file to dest path			
			fs.createReadStream(oldpath).pipe(fs.createWriteStream(newpath));
			
			// read file
			
			fs.readFile(newpath, function(err, data) {
				if(err) throw err;
				var array = data.toString().split("\n");
				for(var i in array) {
					console.log(array[i]);
					var tmpArray = array[i];
					var blockArray = tmpArray.toString().split(",");
					var newBlock = generateNextBlock(blockArray[0],blockArray[1],blockArray[2],blockArray[3],blockArray[4]);
					addBlock(newBlock);
				}
			});
			
			//var input = fs.createReadStream(newpath);
			//readLines(input, func);
			
				res.write('File uploaded and moved!');
				res.end();
			//});
			
			
		});
	});
	
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};


var initP2PServer = () => {
    var server = new WebSocket.Server({port: p2p_port});
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);

};

var initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};

var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};


var generateNextBlock = (blockData0,blockData1,blockData2,blockData3,blockData4) => {
    var previousBlock = getLatestBlock();
    var nextIndex = previousBlock.index + 1;
    var nextTimestamp = new Date().getTime() / 1000;
    var nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData0, blockData1, blockData2, blockData3, blockData4);
    return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData0, blockData1, blockData2, blockData3, blockData4, nextHash);
};


var calculateHashForBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.chainID, block.keyID, block.keyVal, block.fieldID, block.fieldVal);
};

var calculateHash = (index, previousHash, timestamp, blockData0, blockData1, blockData2, blockData3, blockData4) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + blockData0, blockData1, blockData2, blockData3, blockData4).toString();
};

var addBlock = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
    }
};

var isValidNewBlock = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    return true;
};

var connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
};

var handleBlockchainResponse = (message) => {
    var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    var latestBlockHeld = getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log("We can append the received block to our chain");
            blockchain.push(latestBlockReceived);
            broadcast(responseLatestMsg());
        } else if (receivedBlocks.length === 1) {
            console.log("We have to query the chain from our peer");
            broadcast(queryAllMsg());
        } else {
            console.log("Received blockchain is longer than current blockchain");
            replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};

var replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        broadcast(responseLatestMsg());
    } else {
        console.log('Received blockchain invalid');
    }
};

var isValidChain = (blockchainToValidate) => {
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
        return false;
    }
    var tempBlocks = [blockchainToValidate[0]];
    for (var i = 1; i < blockchainToValidate.length; i++) {
        if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
            tempBlocks.push(blockchainToValidate[i]);
        } else {
            return false;
        }
    }
    return true;
};

var getLatestBlock = () => blockchain[blockchain.length - 1];
var queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
var queryAllMsg = () => ({'type': MessageType.QUERY_ALL});
var responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchain)
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));


function readLines(input, func) {
  var remaining = '';
console.log('Here');
  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n');
    var last  = 0;
    while (index > -1) {
      var line = remaining.substring(last, index);
      last = index + 1;
      func(line);
      index = remaining.indexOf('\n', last);
    }

    remaining = remaining.substring(last);
  });

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
  });
}

function func(data) {
  console.log('Line: ' + data);
}

connectToPeers(initialPeers);
initHttpServer();
initP2PServer();

