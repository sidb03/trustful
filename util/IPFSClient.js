const setIPFSBlock = async (blockData, client) => {
    var block = await client.block.put(Buffer.from(blockData, 'utf-8'))
    console.log("IPFS key", block.cid);
    var varCheck = await client.block.get(block.cid);
    // console.log("VAr CHec", varCheck);
    console.log(varCheck.data.toString('utf8'));
    return block.cid;
}

const getIPFSBlock = async (key, client) =>{
    var self = this;
    var varCheck = await client.block.get(key);
    // console.log("VAr CHec", varCheck);
    // console.log(varCheck.data.toString('utf8'));
    return varCheck.data.toString('utf8');
}

module.exports = {
    setIPFSBlock,
    getIPFSBlock
}