const BULTToken = artifacts.require("BULTToken");
const Vesting = artifacts.require("Vesting");

const { assert, should, expect } = require('chai');
const BigNumber = require('bignumber.js');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract("Vesting", (accounts) => {

    let vesting, bultToken, owner, stackingAddress, burnAddress, marketingAddress, teamAddress, foundationAddress, totalSypply;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    before(async () => {
        vesting = await Vesting.deployed();
        bultToken = await BULTToken.new("Bullit Token", "BULT", 16, 470 * (10 ** 6), false);
        owner = accounts[0];
        stackingAddress = accounts[1];
        burnAddress = accounts[2];
        marketingAddress = accounts[3];
        teamAddress = accounts[4];
        foundationAddress = accounts[5];
        totalSypply = 470 * (10 ** 6);
    });


    describe("Deploy the Contract", async () => {

        it("Check Total Supply", async () => {

            var ts = await vesting.getTotalSupply();
            ts = ts.toString() / (10 ** 16);

            expect(ts).to.be.equal(totalSypply);

        });

        it("Set Token Address and transfer all tokens to the vesting address", async () => {

            await expect(vesting.setTokenAddress(bultToken.address, { from: stackingAddress })).to.be.rejectedWith("Ownable: caller is not the owner")
            await expect(vesting.setTokenAddress(ZERO_ADDRESS)).to.be.rejectedWith("token is the zero address")
            await expect(vesting.setTokenAddress(stackingAddress)).to.be.rejectedWith("address to non-contract")

            await expect(vesting.setTokenAddress(bultToken.address)).to.be.fulfilled

            await expect(bultToken.transfer(vesting.address, BigNumber(totalSypply * (10 ** 16)))).to.be.fulfilled

            var vestingBalance = await bultToken.balanceOf(vesting.address);

            expect(vestingBalance.toString() / (10 ** 16)).to.be.equal(totalSypply)

        });

        it("Add Allocation Category", async () => {

            //Add 20 second from now
            var firstVestingDate = Math.floor(new Date(new Date().getTime() + 20 * 1000).getTime() / 1000);
            //Add 2 minutes from now
            var firstVestingDateForStacking = Math.floor(new Date(new Date().getTime() + 1000 * 60 * 2).getTime() / 1000);

            await expect(
                vesting.addAllocationCategory(stackingAddress, "Stacking", BigNumber((75 * (10 ** 6) * (10 ** 16))), 0, 60, firstVestingDate, { from: stackingAddress })
            ).to.be.rejectedWith("Ownable: caller is not the owner");

            await expect(
                vesting.addAllocationCategory(stackingAddress, "Stacking", BigNumber((75 * (10 ** 6) * (10 ** 16))), 0, 60, firstVestingDate)
            ).to.be.rejectedWith("The claim count must be greater than zero");

            await expect(
                vesting.addAllocationCategory(stackingAddress, "", BigNumber((75 * (10 ** 6) * (10 ** 16))), 0, 60, firstVestingDate)
            ).to.be.rejectedWith("The name is required");

            await expect(
                vesting.addAllocationCategory(stackingAddress, "Stacking", BigNumber((75 * (10 ** 6) * (10 ** 16))), 3, 60, firstVestingDateForStacking)
            ).to.be.fulfilled;

            await vesting.addAllocationCategory(burnAddress, "Burn", BigNumber((50 * (10 ** 6) * (10 ** 16))), 3, 60, firstVestingDate);

            await vesting.addAllocationCategory(marketingAddress, "Marketing", BigNumber((70 * (10 ** 6) * (10 ** 16))), 3, 60, firstVestingDate);

            await vesting.addAllocationCategory(teamAddress, "Team", BigNumber((125 * (10 ** 6) * (10 ** 16))), 3, 30, firstVestingDate);

            await vesting.addAllocationCategory(foundationAddress, "Foundation", BigNumber((150 * (10 ** 6) * (10 ** 16))), 3, 60, firstVestingDate);

            await expect(
                vesting.addAllocationCategory(foundationAddress, "Foundation", BigNumber((150 * (10 ** 6) * (10 ** 16))), 3, 60, firstVestingDate)
            ).to.be.rejectedWith("Category is already exist")

        });


        it("Set First Vesting Date only by owner", async () => {

            var firstVestingDate = Math.floor(new Date(new Date().getTime()).getTime() / 1000);
            await new Promise(r => setTimeout(r, 15000));

            var teamFirstVestingDate = vesting.setFirstVestingDate(teamAddress, firstVestingDate);
            await expect(teamFirstVestingDate).to.be.rejectedWith("Distribution stage have been started already");

            // Update vesting date to 1 min
            firstVestingDate = Math.floor(new Date(new Date().getTime() + 1000 * 60 * 1).getTime() / 1000);
            var stackingFirstVestingDate = vesting.setFirstVestingDate(stackingAddress, firstVestingDate);
            await expect(stackingFirstVestingDate).to.be.fulfilled;

        });


        it("Set Vesting Duration only by owner", async () => {

            await new Promise(r => setTimeout(r, 15000));

            // update from 60 to 50 seconds
            var teamDuration = vesting.setVestingDuration(teamAddress, 50);
            await expect(teamDuration).to.be.rejectedWith("Duration cannot be updated");

            // update from 60 to 50 seconds
            var stackingDuration = vesting.setVestingDuration(stackingAddress, 50);
            await expect(stackingDuration).to.be.fulfilled;

        });


        it("Set Vesting Duration only by owner", async () => {

            await new Promise(r => setTimeout(r, 15000));

            // update from 3 to 5 seconds
            var teamDuration = vesting.setVestingCount(teamAddress, 5);
            await expect(teamDuration).to.be.rejectedWith("Vesting count cannot be updated");

            // update from 60 to 50 seconds
            var stackingDuration = vesting.setVestingCount(stackingAddress, 5);
            await expect(stackingDuration).to.be.fulfilled;

        });



        it("Get Categories", async () => {
            await expect(vesting.getCategories({ from: stackingAddress })).to.be.rejectedWith("Ownable: caller is not the owner")
            categories = await getCategories()
            console.log("Categories: ", categories);
        })



        it("Individual Claim for Team Category", async () => {

            var teamBalance, categories, index = 3;


            await expect(vesting.claimAvailableAllocation({ from: accounts[9] })).to.be.rejectedWith("Address is not exist")

            await expect(vesting.claimAvailableAllocation({ from: teamAddress })).to.be.rejectedWith("Distribution stage didn't start yet")

            /********************** Start First Claim **********************/

            await new Promise(r => setTimeout(r, 20000));

            categories = await getCategories()
            console.log("Before First Claim", categories[index])


            assert(categories[index].collectedAllocation == 0)

            await expect(vesting.claimAvailableAllocation({ from: teamAddress })).to.be.fulfilled

            await expect(vesting.claimAvailableAllocation({ from: teamAddress })).to.be.rejectedWith("There is no Available Allocation at the moment")

            categories = await getCategories()
            console.log("First Claim", categories[index])

            let availableAllocationFirstClaim = parseInt((categories[index].balance / categories[index].vestingCount) / (10 ** 16));
            assert(parseInt(categories[index].collectedAllocation / (10 ** 16)) == availableAllocationFirstClaim)

            teamBalance = await getBalance(teamAddress);
            await expect(teamBalance).to.be.equal(categories[index].collectedAllocation)

            /********************** End First Claim **********************/

            /********************** Start Second Claim **********************/

            await new Promise(r => setTimeout(r, 31000));

            categories = await getCategories()
            console.log("Before Second Claim", categories[index])


            await expect(vesting.claimAvailableAllocation({ from: teamAddress })).to.be.fulfilled


            categories = await getCategories()
            console.log("Second Claim", categories[index])

            let availableAllocationSecondClaim = parseInt((categories[index].balance / categories[index].vestingCount) / (10 ** 16) * 2);
            assert(parseInt(categories[index].collectedAllocation / (10 ** 16)) == availableAllocationSecondClaim)

            teamBalance = await getBalance(teamAddress);
            await expect(teamBalance).to.be.equal(categories[index].collectedAllocation)


            /********************** End Second Claim **********************/

            /********************** Start Last Claim **********************/

            await new Promise(r => setTimeout(r, 31000));

            categories = await getCategories()
            console.log("Before Last Claim", categories[index])


            await expect(vesting.claimAvailableAllocation({ from: teamAddress })).to.be.fulfilled


            categories = await getCategories()
            console.log("Last Claim", categories[index])

            assert(categories[index].collectedAllocation == categories[index].balance)

            teamBalance = await getBalance(teamAddress);
            await expect(teamBalance).to.be.equal(categories[index].collectedAllocation)

            /********************** End Last Claim **********************/

            await expect(vesting.claimAvailableAllocation({ from: teamAddress })).to.be.rejectedWith("All Balance has been claimed")
        })


        it("Claim all claims at once for a Team Category", async () => {

            var index = 3

            await new Promise(r => setTimeout(r, 80000));

            await expect(vesting.claimAvailableAllocation({ from: teamAddress })).to.be.fulfilled

            await expect(vesting.claimAvailableAllocation({ from: teamAddress })).to.be.rejectedWith("All Balance has been claimed")

            categories = await getCategories()
            console.log("Team Category: ", categories[index]);

            assert(categories[index].collectedAllocation == categories[index].balance)

            var teamBalance = await getBalance(teamAddress);
            await expect(teamBalance).to.be.equal(categories[index].collectedAllocation)

        })

        async function getCategories() {

            var categories = await vesting.getCategories();
            expect(categories).to.be.length(5)
            categories = await Promise.all(categories.map(async (category) => {
                return {
                    categoryName: category.categoryName,
                    categoryAddress: category.categoryAddress,
                    balance: category.balance,
                    collectedAllocation: category.collectedAllocation,
                    availableAllocation: category.availableAllocation,
                    vestingDuration: category.vestingDuration,
                    vestingCount: category.vestingCount,
                    firstVestingDate: category.firstVestingDate,
                    nextVestingDate: category.nextVestingDate

                };
            }));

            return categories

        }

        async function getBalance(address) {

            var teamBalance = await bultToken.balanceOf(address);
            teamBalance = teamBalance.toString();

            return teamBalance
        }



    });






});

