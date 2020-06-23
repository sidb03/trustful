var Trustful = artifacts.require("./Trustful.sol");

module.exports = function(deployer) {
  deployer.deploy(Trustful);
};
