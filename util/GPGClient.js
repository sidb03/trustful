const openpgp = require("openpgp");

// var debug = require('debug-log2')
var _ = require('lodash')
var _parseKey = require('gpg-parsekeys')
var spawnSync = require('child_process').spawnSync;

function _utilGetKeys() {
    // debug('_utilGetKeys entered')
    var listKeys = spawnSync('gpg', ['--fingerprint'])
    // console.log("keys", listKeys);
    var output = listKeys.stdout.toString()
    // output = output.split('\n\n')
    console.log("OUTPUT", _parseKey(output)[0].subs);
    var secrets = spawnSync('gpg', ['--list-secret-keys']).stdout.toString()
    return _.sortBy(_parseKey(output, secrets), 'date')
}

async function lookUpWithEmail(email) {
    var hkp = new openpgp.HKP(); // Defaults to https://keyserver.ubuntu.com, or pass another keyserver URL as a string
    var newEmail = "";
    for (let index = 0; index < email.length; index++) {
        if(email.charCodeAt(index) !== 0)
            newEmail = newEmail + (email[index]);
    }
    let publicKeyArmored = await hkp.lookup({
        query: newEmail
    });
    return publicKeyArmored;
}

const generatePGPKey = async function (userName, userEmail, passphrase) {
    const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await openpgp.generateKey({
        userIds: [{ name: userName, email: userEmail }], // you can pass multiple user IDs
        curve: 'ed25519',                                           // ECC curve name
        passphrase: passphrase           // protects the private key
    });
    var hkp = new openpgp.HKP();
    await hkp.upload(publicKeyArmored);
    return {
        privateKeyArmored, publicKeyArmored
    }
}

const generateSignedAttribute = async function (address, privateKeyArmored, passphrase) {
    // const passPhrase = await getPassPhrase();
    const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);
    const { data: cleartext } = await openpgp.sign({
        message: openpgp.cleartext.fromText('Ethereum Address' + address), // CleartextMessage or Message object
        privateKeys: [privateKey]                             // for signing
    });
    console.log(cleartext); // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
    return {
        cleartext
    }
}

const verifyMessage = async (clearText, publicKeyArmored) => {
    const verified = await openpgp.verify({
        message: await openpgp.cleartext.readArmored(clearText),           // parse armored message
        publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys // for verification
    });
    const { valid } = verified.signatures[0];
    if (valid) {
        console.log('signed by key id ' + verified.signatures[0].keyid.toHex());
        return true;
    } else {
        return false
    }

}
const getPassPhrase = async function (passphrase = "naksjdnkjasnd kjnaskjdjkasnjkdnjksajkndkjasbdk ") {
    return passphrase;
}

const generatePGPAttributeData = async function (userName, userEmail, passphrase, address) {
    const { privateKeyArmored, publicKeyArmored} = await generatePGPKey(userName, userEmail, passphrase);
    const { cleartext } = await generateSignedAttribute(address, privateKeyArmored, passphrase);
    const publicKeyArmored1 = await lookUpWithEmail(userEmail);
    await verifyMessage(cleartext, publicKeyArmored1);
    return {
        data: cleartext
    }
}

const verifyPGPAttribute = async function (data, email) {
    try{
        const publicKeyArmored1 = await lookUpWithEmail(email);
        var valid = await verifyMessage(data, publicKeyArmored1);
        return valid;
    }
    catch(err) {
        console.error("Error in validating PGP", err);
    }
}
module.exports = {
    generatePGPAttributeData,
    verifyPGPAttribute
}