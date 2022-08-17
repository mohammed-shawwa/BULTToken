const tokenBULT = artifacts.require("BULTToken");

module.exports = function (deployer) {
    deployer.deploy(tokenBULT, 'Bullit Token', 'BULT', 16, 500 * (10**6), false);
};
