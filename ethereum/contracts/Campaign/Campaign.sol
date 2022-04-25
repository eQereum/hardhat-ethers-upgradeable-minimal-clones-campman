// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import './CampaignLogics.sol';
import './CampaignModifiers.sol';

contract Campaign is CampaignModifiers, CampaignLogics {
    function initialize(
        address payable _owner,
        address payable _factory,
        address payable _token,
        address payable _pool,
        bytes32 _name,
        string memory _description,
        string memory _banner,
        uint64 _minimum,
        uint32 _contributionPeriod,
        address _manager
    ) public initializer {
        owner = _owner;
        factory = _factory;
        poolCloneFactoryAddress = _pool;
        campaignName = _name;
        campaignDescription = _description;
        bannerIPFS = _banner;
        manager = _manager;
        minimumContribution = _minimum;
        contributionPeriod = _contributionPeriod;
        campaignCreationTime = uint32(block.timestamp);
        campaignTokenAddress = payable(address(_createClone(_token, abi.encodeWithSelector(Token.initialize.selector, 'CampToken', 'CT', payable(address(this)), manager))));
        requestApprovalPeriod = 30 days;
    }

    fallback() external payable {
        owner.transfer(msg.value);
    }

    function contribute() public payable override notClosed {
        _contribute();
    }

    function createRequest(
        string memory description,
        uint128 value,
        address payable recipient
    ) public notClosed onlyManager {
        _createRequest(description, value, recipient);
    }

    function approveRequest(uint16 index) public override notClosed onlyInvestor {
        _approveRequest(index);
    }

    function finalizeRequest(uint16 index) public override notClosed onlyManager noReentrant {
        _finalizeRequest(index);
    }

    function cancelRequest(uint16 index) public override notClosed onlyManager {
        _cancelRequest(index);
    }

    function getSummary() external view override returns (CampaignSummary memory) {
        return _getSummary();
    }

    function rejectCampaign() external override onlyOwnerFactory noReentrant returns (address poolAddress) {
        return _rejectCampaign();
    }
}
