const Vesting = artifacts.require("Vesting");

module.exports = function (deployer) {
    deployer.deploy(Vesting);
};
