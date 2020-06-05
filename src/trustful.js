const contract = require('truffle-contract');
const userConfig = require('../userConfig.json')
const trustful_artifact = require('../build/contracts/Trustful.json');
const fs = require("fs");
var Trustful = contract(trustful_artifact);
const IPFSClientInteract = require('../util/IPFSClient');
const { generatePGPAttributeData,verifyPGPAttribute } = require('../util/GPGClient')

const promisify = (inner) =>
    new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    );

const init = async function () {
    var self = this;
    
    Trustful.setProvider(self.web3.currentProvider);

    try {
        var accounts = await promisify(cb => self.web3.eth.getAccounts(cb));
        if (accounts.length == 0) {
            console.log("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
            return;
        }
        self.accounts = accounts;
        self.fromAddress = self.accounts[2];
        var TrustfulInstance = await Trustful.deployed();
        self.TrustfulInstance = TrustfulInstance;
        self.toAddress = TrustfulInstance.address;
        return {
            accounts,
            TrustfulInstance
        };
    }
    catch(err) {
        console.error("There was an error fetching your accounts.", err);
        return;
    }
}


const testFunction = async function (int) {
    var self = this;
    self.init(async function(accounts,TrustfulInstance) {
        var result = await TrustfulInstance.testFunction(int, {from: accounts[1]});
        console.log(result);
        return result;
    })
}

const addAttribute = async function (attributetype, has_proof, identifier, data, datahash, self = this, fromAddress = null) {
    var {accounts, TrustfulInstance} = await self.init();
        try{
            var result = await TrustfulInstance.addAttribute(attributetype, has_proof, identifier, data, datahash, {from: fromAddress ? fromAddress : self.fromAddress, gas:3000000});

            console.log("Add Attribute Success", result);
            return {
                attributeID: result.logs[0].args.attributeID.toString(),
                owner: result.logs[0].args.owner,
                txHash: result.tx,
                gasUsed: result.receipt.gasUsed
            };
        }
        catch(err) {
            console.error("Adding attribute failed", err);
        }
}
const signAttribute = async function (attributeID, expiry, fromAddress = null) {
    var self = this;
    var { accounts, TrustfulInstance } = await self.init();
        try{
            var result = await TrustfulInstance.signAttribute(attributeID, expiry, {from: fromAddress ? fromAddress : self.fromAddress, gas:3000000});
            console.log("Sign Attribute Success", );
            return {
                signatureID: result.logs[0].args.signatureID.toString(),
                signer: result.logs[0].args.signer,
                expiry,
                attributeID,
                txHash: result.tx,
                gasUsed: result.receipt.gasUsed
            };
        }
        catch(err) {
            console.error("Sign attribute failed", err);
        }
}
const revokeSignature = async function (signatureID, fromAddress = null) {
    var self = this;
    var { accounts, TrustfulInstance } = await self.init();
        try{
            var result = await TrustfulInstance.revokeSignature(signatureID, {from: fromAddress ? fromAddress : self.fromAddress, gas:3000000});
            // console.log("Revoke Signature Success", result);
            return {
                signatureID: signatureID,
                revocationID: result.logs[0].args.revocationID.toString(),
                txHash: result.tx,
                gasUsed: result.receipt.gasUsed
            };
        }
        catch(err) {
            console.error("Revoke Signature failed", err);
        }
}

const retrieveAttribute = async function (attributeID, TrustfulInstance = null, IPFSClient = null) {
    if (!TrustfulInstance) {
        var self = this;
        var { accounts, TrustfulInstance } = await self.init();
        IPFSClient = self.IPFSClient;
    }
        try{
            var result = await TrustfulInstance.getAttributeByID(attributeID);
            var splitResult = (result.toString()).split(',');
            var attributeProperties = [];
            // console.log("result", result);
            for(var i=0;i<splitResult.length;i++){
                attributeProperties.push(splitResult[i].toString());
            }
            var attribute = {
                owner: attributeProperties[0],
                attributeType: attributeProperties[1],
                hasProof: attributeProperties[2],
                identifier: attributeProperties[3],
                data: attributeProperties[4],
                datahash: attributeProperties[5],
                proofValid: null
            }
            if(attribute.data.startsWith('ipfs-block://')) {
                // console.log("IPFSLCIEN", IPFSClient);
                var ipfsData = await IPFSClientInteract.getIPFSBlock(attribute.data.replace('ipfs-block://', ''), IPFSClient)
                console.log("GOT IPFS", ipfsData);
                attribute.ipfsAddress = attribute.data;
                attribute.data = ipfsData;
                if(attribute.attributeType == 'pgp-key') {
                    var valid = await verifyPGPAttribute(ipfsData, attribute.identifier)
                    console.log("Validity check", valid);
                    attribute.proofValid = valid;
                }
            }
            attribute.signatures = await getAttributeSignatureStatus(attributeID, TrustfulInstance);
            attribute.isOwnerTrusted = await isTrustedAddress(attribute.owner);
            // console.log("Attribute is", attribute)
            return attribute;
        }
        catch(err) {
            console.error("Retrieve Attribute by ID failed", JSON.stringify(err));
        }
}
function hexToString (hex) {
    var string = '';
    hex = hex.substr(2)
    for (var i = 0; i < hex.length; i += 2) {
        if(parseInt(hex.substr(i), 16) !== 0)
            string += String.fromCharCode(parseInt(hex.substr(i), 16));
    }
    return string;
}
const getAttributeByType = async function (accounts,TrustfulInstance, attributeType, IPFSClient) {
    var self = this;
        try{
            var result = await TrustfulInstance.getAttributesByType(attributeType);
            var attributeIds = [];
            
            for(var i=0;i<result.length;i++){
                attributeIds.push(result[i].toString());
            }
            const attributes = attributeIds.map(async function(attributeId)  {
                var result = await retrieveAttribute(Number(attributeId), TrustfulInstance, IPFSClient);
                return result;
            });
            return Promise.all(attributes);
        }
        catch(err) {
            console.error("Get Attrbutes by type failed", err.stack);
        }
}
const getAttributesByIdentifier = async function (accounts,TrustfulInstance, attributeIdentifier, IPFSClient) {
    var self = this;
        try{
            var result = await TrustfulInstance.getAttributesByIdentifier(attributeIdentifier);
            var attributeID = result.toNumber();
            if(attributeID) {
                return await retrieveAttribute(attributeID, TrustfulInstance);
            }
            else {
                return null;
            }
        }
        catch(err) {
            console.error("Get Attrbutes by identifier failed", err.stack);
        }
}


const searchAttributes = async function (type = null, identifier = null) {
     var self = this;
    var { accounts, TrustfulInstance } = await self.init();
        try{
            var attributes;
            if(type) {
                attributes = await getAttributeByType(accounts,TrustfulInstance, type, self.IPFSClient);
            }
            else if(identifier) {
                attributes = await getAttributesByIdentifier(accounts,TrustfulInstance, identifier, self.IPFSClient);
            }
            console.log("HERE", attributes)
            return attributes;
        }
        catch(err) {
            console.error("Search Attrbutes failed", err.stack);
        }
}
const trustAddress = async function(address) {
    // var userConfig = JSON.parse(userConfigJSON);
    try{
        if(!userConfig.trustStore) {
            userConfig.trustStore = {};
        }
        userConfig.trustStore[address] = true;
        fs.writeFile('userConfig.json', JSON.stringify(userConfig), (err, data) => console.error(err, data));
        return;
    }
    catch(Err) {
        console.error("Error Adding trusted Address",  Err);
        throw Err;
    }
}
const unTrustAddress = async function(address) {
    // var userConfig = JSON.parse(userConfigJSON);
    try {
    if(!userConfig.trustStore) {
        userConfig.trustStore = {};
    }
    if(userConfig.trustStore[address]) {
        delete userConfig.trustStore[address]
    }
    fs.writeFile('userConfig.json', JSON.stringify(userConfig), (err, data) => console.error(err, data));    
    } catch (error) {
        console.error("Error Removing trusted Address",  error);
        throw error;
    }
}
const isTrustedAddress = async function(address) {
    // var userConfig = JSON.parse(userConfigJSON);
    if(userConfig.trustStore) {
        return (userConfig.trustStore.hasOwnProperty(address)) && userConfig.trustStore[address]
    }
}
const getTrusted = async function() {
    // var userConfig = JSON.parse(userConfigJSON);
    if(userConfig.trustStore) {
        return Object.keys(userConfig.trustStore)
    }
}
const addAttributeOverIPFS = async function (attributetype, has_proof, identifier, data, datahash, self = this) {
    // var self = this;
    var ipfsKey = await IPFSClientInteract.setIPFSBlock(data, self.IPFSClient);

    var ipfsUri = 'ipfs-block://' + ipfsKey
    console.log("Added to IPFS", ipfsUri);
    var result = await addAttribute(attributetype, has_proof, identifier, ipfsUri, '', self);
    return {
        ...result,
        ipfsAddress: ipfsUri
    }
}
const addPGPAttributeOverIPFS = async function (userName, userEmail, passphrase) {
    var self = this;
    var { accounts, TrustfulInstance } = await self.init();
        try{
            const { data} = await generatePGPAttributeData(userName, userEmail, passphrase, self.fromAddress);
            console.log("GPG Succeeded", data);
            var result = await addAttributeOverIPFS('pgp-key', true, userEmail ,data, '', self)
            console.log("IPFS ADD ", result);
            return {
                ...result,
                dataHash: data
            }
        }
        catch(err) {
            console.error("Add PGP Attrbute failed", err.stack);
        }
}

const getAttributeSignatureStatus = async function(attributeID, TrustfulInstance = null) {
        try {
            const signatureIDs = await getAllSignaturesForAttribute(TrustfulInstance, attributeID);
            const revocations = await getAllRevocations(TrustfulInstance);
            const signatures = signatureIDs.map(async signatureId => {
                let signature = await getSignatureById(TrustfulInstance, signatureId);
                if(revocations.includes(signatureId)) {
                    signature.status = 'revoked';
                }
                else if(Math.floor((new Date()).getTime() / 1000) > Number(signature.expiry)) {
                    signature.status = 'expired';
                }
                else {
                    signature.status = 'valid';
                }
                signature.ownerTrusted = await isTrustedAddress(signature.signer);
                return signature;
            });
            const result = await Promise.all(signatures)
            return result;
        }
        catch(err) {
            console.error("Get Attribute Signature Status failed", err.stack);
        }
}

const getAllRevocations = async function(TrustfulInstance) {
    // console.log("FOUnd", self.TrustfulInstance);
    var result = await TrustfulInstance.getAllRevocations();
    // console.log("RRVO REsult", result);
    var revocations = [];
     for(var i=0;i<result.length;i++){
        revocations.push(result[i].toString());
    }
    // console.log("Revocations", revocations);
    return revocations;
}
const getAllSignaturesForAttribute = async function(TrustfulInstance, attributeID) {
    // console.log("SElf", attributeID, self.TrustfulInstance);
    // console.log(TrustfulInstance.getSignaturesOfAttribute, attributeID);
    var result = await TrustfulInstance.getSignaturesOfAttribute(attributeID);
    var signatureIDs = [];
     for(var i=0;i<result.length;i++){
        signatureIDs.push(result[i].toString());
    }
    // console.log("signatureIDs:", signatureIDs);
    return signatureIDs;
}
const getSignatureById = async function(TrustfulInstance, signatureID) {
     var result = await TrustfulInstance.getSignature(signatureID);
        var splitResult = (result.toString()).split(',');
        var signatureProperties = [];
        for(var i=0;i<splitResult.length;i++){
            signatureProperties.push(splitResult[i].toString());
        }
        var signature = {
            signer: signatureProperties[0],
            expiry: signatureProperties[1]
        }
        return signature;
}

 module.exports = {
    testFunction,
    init,
    addAttribute,
    signAttribute,
    revokeSignature,
    searchAttributes,
    retrieveAttribute,
    getAttributesByIdentifier,
    getAttributeByType,
    trustAddress,
    unTrustAddress,
    isTrustedAddress,
    getTrusted,
    addAttributeOverIPFS,
    addPGPAttributeOverIPFS,
    getAttributeSignatureStatus
}