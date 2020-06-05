import arg from 'arg';
import inquirer from 'inquirer';
import Trustful from './trustful';
import IPFSClient from "../util/IPFSClient";
const IPFS = require('ipfs');
import chalk from 'chalk';
const Web3 = require('web3');
// import { createProject } from './main';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--attributeType': String,
            '--identifier': String,
            '--data': String,
            '--userName': String,
            '--email': String,
            '--passphrase': String,
            '--attributeID': Number,
            '--searchBy': String,
            '--searchTerm': String,
            '--expiry': Number,
            '--signatureID': Number,
            '--address': String
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        attributeType: args['--attributeType'] || null,
        identifier: args['--identifier'] || null,
        data: args['--data'] || null,
        userName: args['--userName'] || null,
        email: args['--email'] || null,
        passphrase: args['--passphrase'] || null,
        attributeID: args['--attributeID'] || null,
        searchBy: args['--searchBy'] || null,
        searchTerm: args['--searchTerm'] || null,
        expiry: args['--expiry'] || null,
        signatureID: args['--signatureID'] || null,
        address: args['--address'] || null,
        command: args._[0],
    };
}

async function promptForMissingOptions(options) {
    const defaultCommand = 'add';
    // if (options.skipPrompts) {
    //     return {
    //         ...options,
    //         template: options.template || defaultTemplate,
    //     };
    // }
    const questions = [];
    if (!options.command) {
        const answer = await inquirer.prompt({
            type: 'list',
            name: 'command',
            message: 'Please choose the command to run',
            choices: [
                { name: 'Add Attribute', value: 'add' },
                { name: 'Add Attribute Over IPFS', value: 'ipfsAdd' },
                { name: 'Add PGP Key as Attribute', value: 'ipfsAddPGP' },
                { name: 'Retrieve Attribute', value: 'retrieve' },
                { name: 'Search for Attribute', value: 'search' },
                { name: 'Sign Attribute', value: 'sign' },
                { name: 'Revoke Sign for Attribute', value: 'revoke' },
                { name: 'Add a Trusted Ethereum Address', value: 'trust' },
                { name: 'Remove a Trusted Ethereum Address', value: 'untrust' },
                { name: 'View List of All Trusted Addresses', value: 'trusted' },
                { name: 'Exit to console', value: 'quit' }
            ],
            default: defaultCommand,
        });
        options.command = answer.command;
    }
    console.log('Selected', options.command);
    switch (options.command) {
        case 'ipfsAdd':
        case 'add':
            if (!options.attributeType || !options.identifier || !options.data) {
                var answers = await inquirer.prompt([{
                    type: 'input',
                    name: 'attributeType',
                    message: 'What is the type of the Attribute?',
                    default: options.attributeType || 'defaultType'
                },
                {
                    type: 'input',
                    name: 'identifier',
                    message: 'Please enter a unique identifier for the attribute',
                    default: options.identifier || 'defaulltIdentifier' //TODO
                },
                {
                    type: 'editor',
                    name: 'data',
                    message: 'Please enter the data that you want to store under this attribute',
                    default: options.data || ''
                }])
            }
            Object.assign(options, answers);
            console.log("Add Selected", options.attributeType, options.identifier, options.data, options.command);
            var result;
            try {
                if (options.command == 'add')
                    result = await Trustful.addAttribute(options.attributeType, false, options.identifier, options.data, '');
                else
                    result = await Trustful.addAttributeOverIPFS(options.attributeType, false, options.identifier, options.data, '');
                console.log("Attribute Added Successfully!", result);
            }
            catch (err) {
                console.err("Add Attribute failed", err);
            }
            break;
        case 'ipfsAddPGP':
            if (!options.userName || !options.email || !options.passphrase) {
                var answers = await inquirer.prompt([{
                    type: 'input',
                    name: 'userName',
                    message: 'Enter username to generate PGP key for',
                    default: options.userName || 'jane doe'
                },
                {
                    type: 'input',
                    name: 'email',
                    message: 'Please enter email to associate the key with',
                    default: options.email || 'jane@doe.com' //TODO
                },
                {
                    type: 'password',
                    name: 'passphrase',
                    message: 'Please enter passphrase to lock your private key',
                    default: options.passphrase || 'ReAllYStrongPas$Phrase'
                }])
            }
            Object.assign(options, answers);
            console.log("ipfsAddPGP Selected", options.userName, options.email, options.passphrase)
            try {
                var result = await Trustful.addPGPAttributeOverIPFS(options.userName, options.email, options.passphrase);
                console.log("Added PGP Key Successfully!", result);
            } catch (err) {
                console.error("PGP add attribute failed", err);
            }
            break;
        case 'retrieve':
            if (!options.attributeID) {
                var answers = await inquirer.prompt([{
                    type: 'number',
                    name: 'attributeID',
                    message: 'Enter Attribute ID to retrieve',
                    default: options.attributeID || '0'
                }])
            }
            Object.assign(options, answers);
            console.log("retrieve Selected", options.attributeID);
            try {
                var result = await Trustful.retrieveAttribute(options.attributeID);
                console.log("Attributes are:", result);
            } catch (err) {
                console.error("Retrieve attribute failed", err);
            }
            break;
        case 'search':
            if (!options.searchBy || !options.searchTerm) {
                var answers = await inquirer.prompt([{
                    type: 'list',
                    name: 'searchBy',
                    message: 'Select what you wnat to search by:',
                    choices: [{ name: 'Attribute Type', value: 'attributeType' }, { name: 'Attribute Identifier', value: 'attributeIdentifier' }],
                    default: options.searchBy || 'attributeType'
                },
                {
                    type: 'input',
                    name: 'searchTerm',
                    message: 'Enter Search Term',
                    default: options.searchTerm || 'defaultType'
                }]
                )
            }
            Object.assign(options, answers);
            console.log("search Selected", options.searchBy, options.searchTerm);
            try {
                var result;
                if (options.searchBy == 'attributeType') {
                    result = await Trustful.searchAttributes(options.searchTerm);
                }
                else if (options.searchBy == 'attributeIdentifier') {
                    result = await Trustful.searchAttributes(null, options.searchTerm);
                }
                console.log("Searched Attributes:", result);
            } catch (err) {
                console.error("Search attribute failed", err);
            }
            break;
        case 'sign':
            if (!options.attributeID || !options.expiry) {
                var answers = await inquirer.prompt([{
                    type: 'number',
                    name: 'attributeID',
                    message: 'Enter Attribute ID to Sign',
                    default: options.attributeID || '0'
                },
                {
                    type: 'number',
                    name: 'expiry',
                    message: 'Enter time for expiry of signature (in days)',
                    default: options.expiry || '10'
                }]
                )
            }
            Object.assign(options, answers);
            console.log("sign Selected", options.attributeID, options.expiry);
            try {
                var expiryTime = Math.floor((new Date()).getTime() / 1000) + Number(options.expiry) * 60 * 60 * 24;
                var result = await Trustful.signAttribute(options.attributeID, expiryTime);
                console.log("Sign Successful:", result);
            } catch (err) {
                console.error("Sign attribute failed", err);
            }
            break;
        case 'revoke':
            if (!options.signatureID) {
                var answers = await inquirer.prompt([{
                    type: 'number',
                    name: 'signatureID',
                    message: 'Enter Signature ID to revoke',
                    default: options.attributeID || '0'
                }]
                )
            }
            Object.assign(options, answers);
            console.log("sign Selected", options.signatureID);
            try {
                var result = await Trustful.revokeSignature(options.signatureID);
                console.log("Sign Revoke Successful:", result);
            } catch (err) {
                console.error("Revoke Sign attribute failed", err);
            }
            break;
        case 'trust':
            if (!options.address) {
                var answers = await inquirer.prompt([{
                    type: 'input',
                    name: 'address',
                    message: 'Enter Ethereum Address to add to trusted list',
                    default: options.address || '0x'
                }]
                )
            }
            Object.assign(options, answers);
            console.log("Trust Selected", options.address);
            try {
                var result = await Trustful.trustAddress(options.address);
                console.log("Add Trusted Address Successful");
            } catch (err) {
                console.error("Add Trusted Address failed", err);
            }
            break;
        case 'untrust':
            if (!options.address) {
                var answers = await inquirer.prompt([{
                    type: 'input',
                    name: 'address',
                    message: 'Enter Ethereum Address to remove from trusted list',
                    default: options.address || '0x'
                }]
                )
            }
            Object.assign(options, answers);
            console.log("Trust Selected", options.address);
            try {
                var result = await Trustful.unTrustAddress(options.address);
                console.log("Remove Trusted Address Successful:");
            } catch (err) {
                console.error("Remove Trusted Address failed", err);
            }
            break;
        case 'trusted':
            console.log("Trusted Selected");
            try {
                var result = await Trustful.getTrusted();
                console.log("Trusted Addresses:", result);
            } catch (err) {
                console.error("Get Trusted Addresses failed", err);
            }
            break;
        case 'quit':
            return true;
        default:
            break;
    }
    return false;
}

export async function cli(args) {
    Trustful.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
    Trustful.IPFSClient = await IPFS.create({silent: true});
    let options = parseArgumentsIntoOptions(args);
    let quitCommand = false;
    while(!quitCommand) {
        quitCommand = await promptForMissingOptions(options);
        options = {}
    }
    process.exit();
}

// ...
