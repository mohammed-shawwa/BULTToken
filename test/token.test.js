const BULTToken = artifacts.require("BULTToken");

const { assert, should, expect } = require('chai');
const toBN = web3.utils.toBN;

require("chai").use(require('chai-as-promised')).should();

contract("BULT Token Contract", async accounts => {


    let token, decimals, balanceForAccount1, balanceForAccount2;
    before(async () => {
        token = await BULTToken.deployed();
    });

    describe("Initial State", () => {

        it("Should have 'name' and 'symbol' specified at the constructor and always have '16' for the decimals.", async () => {

            decimals = await token.decimals();
            assert.equal(await token.name(), "Bullit Token", "Token Name must be Bullit Token");
            assert.equal(await token.symbol(), "BULT", "Bullit Symbol must be BULT");
            assert.equal(decimals, 16, "Bullit Decimals must 16");

        });

        it("Check the owner's address is real.", async () => {

            var admin = await token.getAdmin();
            expect(admin).to.be.not.null
            expect(admin).to.be.not.NaN
            expect(admin).to.be.not.equal(0x0)
            expect(admin).to.be.equal(accounts[0])

        });

        it("Check accounts balance.", async () => {
            var account1 = accounts[0];
            var account2 = accounts[1];

            balanceForAccount1 = await token.balanceOf(account1);
            balanceForAccount1 = balanceForAccount1.toString() / (10 ** decimals)
            console.log(account1, balanceForAccount1);

            assert.equal(balanceForAccount1, 30 * (10 ** 6))

            balanceForAccount2 = await token.balanceOf(account2);
            balanceForAccount2 = balanceForAccount2.toString() / (10 ** decimals)
            console.log(account2, balanceForAccount2);

            assert.equal(balanceForAccount2, 0)

        });

        it("Transfer Balance from the owner to others", async () => {

            var transferFun = await token.transfer(accounts[1], toBN(1000 * (10 ** decimals)), { from: accounts[0] });

            balanceForAccount1 = await token.balanceOf(accounts[0]);
            balanceForAccount1 = balanceForAccount1.toString() / (10 ** decimals)
            assert.equal(balanceForAccount1, 29999000)
            console.log(accounts[0], balanceForAccount1);


            balanceForAccount2 = await token.balanceOf(accounts[1]);
            balanceForAccount2 = balanceForAccount2.toString() / (10 ** decimals)
            assert.equal(balanceForAccount2, 1000)
            console.log(accounts[1], balanceForAccount2);


            //console.log(transferFun);
        });

        it("Transfer Balance from the account does not have any token to another account", async () => {

            await expect(token.transfer(accounts[2], toBN(100 * (10 ** decimals)), { from: accounts[3] })).to.be.rejectedWith(
                "TNT20: transfer amount exceeds balance"
            );

        });

        it("Check allowance before adding an approval for any account", async () => {

            var allowance1 = await token.allowance(accounts[0], accounts[1]);
            allowance1 = allowance1.toString() / (10 ** decimals)
            expect(allowance1).to.be.equal(0)

        })

        it("Add account (1)  to allow transfer token to another accounts", async () => {

            var owner = accounts[0];
            var account1 = accounts[1];

            await token.approve(account1, toBN(2000 * (10 ** 16)), { from: owner });

            var allowance1 = await token.allowance(owner, account1);
            allowance1 = allowance1.toString() / (10 ** decimals)
            expect(allowance1).to.be.equal(2000)

        })

        it("Transfer token from owner to account (3) by account (2) then transfer token from  owner to account (2) by account (1)", async () => {
            var owner = accounts[0]
            var account1 = accounts[1]
            var account2 = accounts[2]
            var account3 = accounts[3]

            // await expect(token.transferFrom(account2, account3, toBN(300 * (10 ** 16)), { from: account2 })).to.be.rejectedWith(
            //     "TNT20: transfer amount exceeds balance"
            // )

            await expect(token.transferFrom(owner, account3, toBN(300 * (10 ** 16)), { from: account2 })).to.be.rejectedWith(
                "TNT20: transfer amount exceeds allowance"
            )

            await token.transferFrom(owner, account2, toBN(500 * (10 ** 16)), { from: account1 })

            var balanceForOwner = await token.balanceOf(owner);
            balanceForOwner = balanceForOwner.toString() / (10 ** decimals)
            assert.equal(balanceForOwner, 29998500)
            console.log(owner, balanceForOwner);

            var balanceForAccount2 = await token.balanceOf(account2);
            balanceForAccount2 = balanceForAccount2.toString() / (10 ** decimals)
            assert.equal(balanceForAccount2, 500)
            console.log(account2, balanceForAccount2);

        })

    });

});