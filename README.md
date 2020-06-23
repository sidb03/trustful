
# trustful
**Decentralized PKI and Identity Management System on Ethereum Blockchain**

*Note - This is an experimental prototype and should not be used in production*

**This project is a part of my undergraduate thesis.**

Modern TCP uses SSL/TSL for secure communication which rely on PKIs to authenticate public keys. Conventional PKI is done by CA (Certification Authorities), issuing and storing Digital Certificates, which are public keys of users with the user’s identity. This leads to centralization of authority with the CAs and a security concern of the storage of CAs being vulnerable. There have been instances where CAs have issued rogue certificates or the CAs have been hacked to issue malicious certificates. 

This project aims to build a decentralized PKI using blockchain. Blockchains provide immutable storage and smart contracts on Ethereum blockchain can be used to build a web of trust model where users can publish attributes, validate attributes about other users by signing them and creating a trust store of users that they trust. The WoT model allows for any entity on the network to verify attributes about any other entity through a trust network. This provides an alternative to the conventional CA based identity verification model.

## Installation

Install Ganache for spawning a local Ethereum Blockchain

Clone this repository and run
```
cd trustful   
npm install  
truffle migrate
```

You can now run the `trustful` command from the command line

## Command Line Options

```
Usage: trustful COMMAND [ARGS]...  
  
Commands:  
add                 Add an attribute to your identity.  
ipfsadd             Add an attribute to your identity over IPFS.  
ipfsaddpgp          Add a PGP key attribute to your identity over IPFS.  
retrieve            Retrieve an attribute.  
revoke              Revoke one of your signatures.  
search              Search for attributes.  
sign                Sign an attribute.  
trust               Trust an Ethereum address.  
trusted             View the list of trusted Ethereum addresses.  
untrust             Untrust an Ethereum address.
```
