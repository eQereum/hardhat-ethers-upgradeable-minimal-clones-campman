// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

contract Pool is Initializable {
    // slot 0: 26 bytes
    address payable public campaignAddress;
    uint16 public investorsCount;
    uint16 public investorsTookETHCount;
    bool public isPoolOpen;
    bool private isLocked;

    // slot 1: 32 bytes
    mapping(address => bool) public hasTakenTheETH;

    // constructor(address payable _campaignAddress, uint16 _investorsCount) payable {
    //     campaignAddress = _campaignAddress;
    //     investorsCount = _investorsCount;
    //     isPoolOpen = true;
    // }
    fallback() external payable {
        if (bytes12(msg.data) != 'initializing') {
            campaignAddress.call{value: msg.value}('');
        }
    }

    receive() external payable {
        campaignAddress.call{value: msg.value}('');
    }

    function initialize(address payable _campaignAddress, uint16 _investorsCount) public payable initializer {
        campaignAddress = _campaignAddress;
        investorsCount = _investorsCount;
        isPoolOpen = true;
    }

    modifier nonReentrant() {
        require(!isLocked, 'ReentrancyGuard: reentrant call');
        isLocked = true;
        _;
        isLocked = false;
    }

    modifier checkIfPoolOpen() {
        require(isPoolOpen, 'pool is closed');
        _;
    }

    modifier eligibleInvestor() {
        (bool isInvestorSuccess, bytes memory result) = campaignAddress.staticcall(abi.encodeWithSignature('isInvestor(address)', msg.sender));
        bool isInvestor = abi.decode(result, (bool));
        require(isInvestorSuccess && isInvestor, 'only campaign investors can take their ETH share');
        require(!hasTakenTheETH[msg.sender], 'this investor has taken ETH share already');
        _;
    }

    event TookShareBackLog(address investor, uint128 value);
    event PoolClosedLog(address campaignAddress, address poolAddress);

    function takeShareBack() external checkIfPoolOpen eligibleInvestor nonReentrant {
        (bool contributionPerInvestorSuccess, bytes memory result) = campaignAddress.staticcall(abi.encodeWithSignature('contributionPerInvestor(address)', msg.sender));
        require(contributionPerInvestorSuccess, 'calling contribution amount of investor failed');
        uint256 contributionPerInvestor = abi.decode(result, (uint256));
        hasTakenTheETH[msg.sender] = true;
        (bool successfullyTookETH, ) = payable(msg.sender).call{value: contributionPerInvestor}('');
        require(successfullyTookETH, 'taking ETH back failed');

        emit TookShareBackLog(msg.sender, uint128(contributionPerInvestor));
        investorsTookETHCount++;
        if (investorsCount == investorsTookETHCount) {
            isPoolOpen = false;
            emit PoolClosedLog(campaignAddress, address(this));
        }
    }

    function getPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getInvestorContributionAmount(address investor) external view checkIfPoolOpen returns (uint256 amount) {
        (, bytes memory result) = campaignAddress.staticcall(abi.encodeWithSignature('contributionPerInvestor(address)', investor));
        amount = abi.decode(result, (uint256));
    }
}
