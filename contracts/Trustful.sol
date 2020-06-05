pragma solidity >=0.4.25 <0.6.0;
// pragma experimental ABIEncoderV2;

contract Trustful {
    struct Attribute {
        address owner;
        string attributeType;
        bool hasProof;
        string identifier;
        string data;
        string datahash;
    }

    struct Signature {
        address signer;
        uint attributeID;
        uint expiry;
    }

    struct Revocation {
        uint signatureID;
    }

    Attribute[] public attributes;
    Signature[] public signatures;
    Revocation[] public revocations;

    mapping(string => uint) public AttributeByIdentier;
    mapping(string => uint[]) public AttributeTypes;
    mapping(uint => uint[]) public signaturesOfAttribute;
    // mapping(uint => uint[]) public revocationsOfAttribute;

    uint public test = 1234;

    event AttributeAdded(uint indexed attributeID, address indexed owner, string attributeType, bool hasProof, string identifier, string data, string datahash);
    event AttributeSigned(uint indexed signatureID, address indexed signer, uint indexed attributeID, uint expiry);
    event SignatureRevoked(uint indexed revocationID, uint indexed signatureID);
    event Successful(uint randomInt, uint square);


    function getAttributeByID(uint attributeID) public view returns(address, string memory, bool, string memory, string memory, string memory) {
        require(attributeID < attributes.length, "Invalid Attribute ID");
        return (attributes[attributeID].owner, attributes[attributeID].attributeType, attributes[attributeID].hasProof, attributes[attributeID].identifier, attributes[attributeID].data, attributes[attributeID].datahash);
    }
    function getAttributesByType(string memory attributeType) public view returns(uint[] memory) {
        return AttributeTypes[attributeType];
    }
    function getAttributesByIdentifier(string memory identifier) public view returns(uint) {
        return AttributeByIdentier[identifier];
    }

    // function getAttributes() public view returns(Attribute[] memory) {
    //     return attributes;
    // }

    function getSignaturesOfAttribute(uint attributeID) public view returns (uint[] memory) {
        require(attributeID < attributes.length, "Invalid Attribute ID");
        return signaturesOfAttribute[attributeID];
    }
    function getSignature(uint signatureID) public view returns(address, uint) {
        require(signatureID < signatures.length, "Invalid Signature ID");
        return (signatures[signatureID].signer, signatures[signatureID].expiry);
    }
    function getAllRevocations() public view returns(uint[] memory ) {
        // uint[] storage signatureIDs;
        uint[] memory signatureIDs = new uint[](revocations.length);
        for (uint index = 0; index < revocations.length; index++) {
            signatureIDs[index] = revocations[index].signatureID;
        }
        return signatureIDs;
    }

    function addAttribute(string memory attributeType, bool hasProof, string memory identifier, string memory data, string memory datahash) public returns (uint attributeID) {
        attributeID = attributes.length++;
        Attribute storage attribute = attributes[attributeID];
        attribute.owner = msg.sender;
        attribute.attributeType = attributeType;
        attribute.hasProof = hasProof;
        attribute.identifier = identifier;
        attribute.data = data;
        attribute.datahash = datahash;
        AttributeByIdentier[identifier] = attributeID;
        AttributeTypes[attributeType].push(attributeID);
        emit AttributeAdded(attributeID, msg.sender, attributeType, hasProof, identifier, data, datahash);
    }

    function signAttribute(uint attributeID, uint expiry) public returns (uint signatureID) {
        require(attributeID < attributes.length, "Invalid Attribute ID");
        signatureID = signatures.length++;
        Signature storage signature = signatures[signatureID];
        signature.signer = msg.sender;
        signature.attributeID = attributeID;
        signature.expiry = expiry;
        signaturesOfAttribute[attributeID].push(signatureID);
        emit AttributeSigned(signatureID, msg.sender, attributeID, expiry);
    }

    function revokeSignature(uint signatureID) public returns (uint revocationID) {
        require(signatureID < signatures.length, "Invalid Signature ID");
        if (signatures[signatureID].signer == msg.sender) {
            revocationID = revocations.length++;
            Revocation storage revocation = revocations[revocationID];
            revocation.signatureID = signatureID;

            emit SignatureRevoked(revocationID, signatureID);
        }
    }

    function testFunction(uint randomInt) public returns (uint square) {
        square = randomInt*2;
        emit Successful(randomInt, square);
    }
}