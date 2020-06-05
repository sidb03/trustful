const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const Web3 = require('web3');
const truffle_trustful = require('./src/trustful.js');
const bodyParser = require('body-parser');
// const { IPFSClient } = require('./util/initIPFS');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


app.get('/test', async (req,res) => {
  try {
    res.send(await truffle_trustful.testFunction(req.body.int)).status(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
  
})
app.get('/searchAttributes', async (req, res) => {
  try {
    var {type, identifier} = req.body;
    var attributes = await truffle_trustful.searchAttributes(type, identifier);
    console.log("ATTRIBUTES", attributes);
    res.send(attributes).status(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})

app.post('/addAttribute', async (req,res) => {
  try {
    var {attributetype, has_proof, identifier, data, datahash} = req.body;
    res.send(await truffle_trustful.addAttribute(attributetype, has_proof, identifier, data, datahash)).status(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
  
})
app.post('/addAttributeIPFS', async (req,res) => {
  try {
    var {attributetype, has_proof, identifier, data, datahash} = req.body;
    res.send(await truffle_trustful.addAttributeOverIPFS(attributetype, has_proof, identifier, data, datahash)).status(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
  
})
app.post('/signAttribute', async (req,res) => {
  try {
    var {attributeID, expiry} = req.body;
    var expiryTime = Math.floor((new Date()).getTime() / 1000) + Number(expiry) * 60 * 60 * 24;
    console.log("EXPIRRY", expiryTime);
    res.send(await truffle_trustful.signAttribute(attributeID, expiryTime)).status(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})
app.get('/addPGPAttribute', async (req, res) => {
  try {
    var { userName, userEmail, passphrase } = req.body;
    console.log(userName, userEmail, passphrase );
    var result = await truffle_trustful.addPGPAttributeOverIPFS(userName, userEmail, passphrase);
    res.send(result).status(200);
  }
  catch (err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})
app.get('/getAllSignatures', async (req, res) => {
  try {
    var { attributeID } = req.body;
    var result = await truffle_trustful.getAttributeSignatureStatus(attributeID);
    res.send(result).status(200);
  }
  catch (err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})
app.delete('/revokeSignature', async (req,res) => {
  try {
    var {signatureID} = req.body;
    res.send(await truffle_trustful.revokeSignature(signatureID)).status(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})

app.post('/trustAddress', async (req, res) => {
  try {
    var {addreess} = req.body;
    await truffle_trustful.trustAddress(addreess);
    res.sendStatus(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})

app.post('/unTrustAddress', async (req, res) => {
  try {
    var {addreess} = req.body;
    await truffle_trustful.unTrustAddress(addreess);
    res.sendStatus(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})

app.get('/isTrustedAddress', async (req, res) => {
  try {
    var {addreess} = req.body;
    var result = await truffle_trustful.isTrustedAddress(addreess);
    res.send(result).status(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})

app.get('/getTrusted', async (req, res) => {
  try {
    var result = await truffle_trustful.getTrusted();
    res.send(result).status(200);
  }
  catch(err) {
    console.log("Error", err);
    res.sendStatus(500);
  }
})

app.listen(port, () => {

  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  truffle_trustful.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
  console.log("Express Listening at http://localhost:" + port);

});
