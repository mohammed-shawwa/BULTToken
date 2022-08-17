// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BULTToken.sol";

contract Vesting is Ownable {
    BULTToken private token;
    uint256 private totalSupply;

    struct AllocationCategory {
        string categoryName;
        address categoryAddress;
        uint256 balance;
        uint256 collectedAllocation;
        uint256 vestingDuration;
        uint256 vestingCount;
        uint256 vestingKickoffDate;
    }

    struct CategoryData {
        string categoryName;
        address categoryAddress;
        uint256 balance;
        uint256 collectedAllocation;
        uint256 availableAllocation;
        uint256 vestingDuration;
        uint256 vestingCount;
        uint256 firstVestingDate;
        uint256 nextVestingDate;
    }

    mapping(string => AllocationCategory) public categoriesList;
    mapping(address => bool) public categoriesListAddress;
    string[] public categoriesListIndex;

    modifier isSenderAddressNonZero() {
        require(msg.sender != address(0x0), "Zero address not Allowed");
        _;
    }

    constructor() {
        totalSupply = 470000000 * 10 ** 16;

        uint256 vestingCount =24;
        uint256 vestingDuration = 5 minutes;
        uint256 firstVestingDate = 1650357300;

        addAllocationCategory(address(0x0), "Staking Rewards",      75 * 10**22,    vestingCount,   vestingDuration,    firstVestingDate);
        addAllocationCategory(address(0x0), "Burn",                 50 * 10**22,    vestingCount,   vestingDuration,    firstVestingDate);
        addAllocationCategory(address(0x0), "Marketing",            70 * 10**22,    vestingCount,   vestingDuration,    firstVestingDate);
        addAllocationCategory(address(0x0), "Team",                 125 * 10**22,   vestingCount,   vestingDuration,    firstVestingDate);
        addAllocationCategory(address(0x0), "Foundation",           150 * 10**22,   vestingCount,   vestingDuration,    firstVestingDate);

    }

    function getTotalSupply() external view returns (uint256) {
        return totalSupply;
    }

    // need to be deployed in the contract constructor
    function setTokenAddress(address _token) external onlyOwner {
        require(address(_token) != address(0), "token is the zero address");
        require(address(_token).code.length > 0, "address to non-contract");
        require(BULTToken(_token).getAdmin() == owner(), "smart contract out of control");

        token = BULTToken(_token);
    }

    function getVestingCount(string memory _categoryName) external view returns (uint256) {
        return categoriesList[_categoryName].vestingCount;
    }

    function setVestingCount(string memory _categoryName, uint256 _vestingCount) external isSenderAddressNonZero onlyOwner {
        require(bytes(categoriesList[_categoryName].categoryName).length > 0, "Category is not exist");
        require(block.timestamp < (categoriesList[_categoryName].vestingKickoffDate + categoriesList[_categoryName].vestingDuration), "Vesting count cannot be updated");
        categoriesList[_categoryName].vestingCount = _vestingCount;
    }

    function getDuration(string memory _categoryName) external view returns (uint256) {
        return categoriesList[_categoryName].vestingDuration;
    }

    function setVestingDuration(string memory _categoryName, uint256 _vestingDuration) external isSenderAddressNonZero onlyOwner {
        require(bytes(categoriesList[_categoryName].categoryName).length > 0, "Category is not exist");
        require(_vestingDuration > 0, "The duration must be greater than zero");
        require(block.timestamp < (categoriesList[_categoryName].vestingKickoffDate + categoriesList[_categoryName].vestingDuration), "Duration cannot be updated");

        categoriesList[_categoryName].vestingDuration = _vestingDuration;
    }

    function getFirstVestingDate(string memory _categoryName) internal view returns (uint256) {
        require(bytes(categoriesList[_categoryName].categoryName).length > 0, "Category is not exist");
        return (categoriesList[_categoryName].vestingKickoffDate + categoriesList[_categoryName].vestingDuration);
    }

    function getNextVestingDate(string memory _categoryName) internal view returns (uint256){
        uint nextVesting = 0;
        uint firstVestingDate = getFirstVestingDate(_categoryName);
        uint lastVestingDate = categoriesList[_categoryName].vestingKickoffDate + (categoriesList[_categoryName].vestingDuration * categoriesList[_categoryName].vestingCount);
        if (block.timestamp < firstVestingDate) {
            nextVesting = firstVestingDate;
        } else if (block.timestamp >= lastVestingDate) {
            nextVesting = lastVestingDate;
        } else {
            nextVesting = categoriesList[_categoryName].vestingKickoffDate +
            ((((block.timestamp - categoriesList[_categoryName].vestingKickoffDate) / categoriesList[_categoryName].vestingDuration) + 1)
            * categoriesList[_categoryName].vestingDuration);
        }
        return nextVesting;
    }

    function setFirstVestingDate(string memory _categoryName, uint256 _firstVestingDate) external isSenderAddressNonZero onlyOwner {
        require(bytes(categoriesList[_categoryName].categoryName).length > 0, "Category is not exist");
        require(block.timestamp < getFirstVestingDate(_categoryName), "Distribution stage have been started already");
        categoriesList[_categoryName].vestingKickoffDate = _firstVestingDate - categoriesList[_categoryName].vestingDuration;
    }

    function addAllocationCategory(
        address _categoryAddress,
        string memory _categoryName,
        uint256 _balance,
        uint256 _vestingCount,
        uint256 _vestingDuration,
        uint256 _firstVestingDate) private {

        categoriesListIndex.push(_categoryName);
        categoriesList[_categoryName] = AllocationCategory(
            _categoryName,
            _categoryAddress,
            _balance,
            0,
            _vestingDuration,
            _vestingCount,
            _firstVestingDate - _vestingDuration
        );
    }

    // modifier checkAddressIfExistsOrNot (address _categoryAddress){
    //     for(uint i = 0 ; i < categoriesListIndex.length ; i++){
    //         if(categoriesList[categoriesListIndex[i]].categoryAddress != address(0x0)){
    //             if(categoriesList[categoriesListIndex[i]].categoryAddress == _categoryAddress){
    //                 revert("Address is exists");
    //             }
    //         }
    //     }
    //     _;
    // }

    function setCategoryAddress(string memory _categoryName,address _categoryAddress) public onlyOwner{ //checkAddressIfExistsOrNot(_categoryAddress) {

        require((keccak256(abi.encodePacked((_categoryName))) != keccak256(abi.encodePacked(("Burn")))), "Cannot add an address to the burn");
        require(bytes(categoriesList[_categoryName].categoryName).length > 0, "Category is not exist");
        
        require(_categoryAddress != address(0x0), "Zero address not Allowed");
        require(categoriesListAddress[_categoryAddress] == false, "Address is exists");

        categoriesList[_categoryName].categoryAddress = _categoryAddress;
        categoriesListAddress[_categoryAddress] = true;
    }

    function getCategoryAvailableAllocation(AllocationCategory memory category) internal view returns (uint256 available_){
        if (block.timestamp > category.vestingKickoffDate) {
            uint vestingCount = (block.timestamp - category.vestingKickoffDate) / category.vestingDuration;
            if (vestingCount < category.vestingCount) {
                available_ = (vestingCount * (category.balance / category.vestingCount)) - category.collectedAllocation;
            } else {
                available_ = category.balance - category.collectedAllocation;
            }
        } else {
            available_ = 0;
        }
        return available_;
    }

    function getCategories() public onlyOwner view returns (CategoryData[] memory categories_) {
        CategoryData[] memory categories = new CategoryData[](categoriesListIndex.length);
        for (uint256 i = 0; i < categories.length; i++) {
            categories[i].categoryName = categoriesList[categoriesListIndex[i]].categoryName;
            categories[i].categoryAddress = categoriesList[categoriesListIndex[i]].categoryAddress;
            categories[i].balance = categoriesList[categoriesListIndex[i]].balance;
            categories[i].collectedAllocation = categoriesList[categoriesListIndex[i]].collectedAllocation;
            categories[i].availableAllocation = getCategoryAvailableAllocation(categoriesList[categoriesListIndex[i]]);
            categories[i].vestingDuration = categoriesList[categoriesListIndex[i]].vestingDuration;
            categories[i].vestingCount = categoriesList[categoriesListIndex[i]].vestingCount;
            categories[i].firstVestingDate = getFirstVestingDate(categoriesListIndex[i]);
            categories[i].nextVestingDate = getNextVestingDate(categoriesListIndex[i]);
        }
        return (categories);
    }

    function claimAvailableAllocation() public onlyOwner {

        for(uint256 i = 0 ; i < categoriesListIndex.length ; i++){
            
            if(categoriesList[categoriesListIndex[i]].categoryAddress != address(0x0)) {
                if(block.timestamp > getFirstVestingDate(categoriesListIndex[i])) {
                    if(categoriesList[categoriesListIndex[i]].collectedAllocation < categoriesList[categoriesListIndex[i]].balance) {
                        uint256 availableVestingAmount = getCategoryAvailableAllocation(categoriesList[categoriesListIndex[i]]);
                        if(availableVestingAmount > 0) {
                            token.transfer(categoriesList[categoriesListIndex[i]].categoryAddress, availableVestingAmount);
                            categoriesList[categoriesListIndex[i]].collectedAllocation += availableVestingAmount;
                        }
                    }
                }
            }

        }

    }

}
