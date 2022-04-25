// SPDX-License-Identifier: MIT
import './FactoryStatesV1.sol';

pragma solidity ^0.8.13;

abstract contract FactoryModifiersV1 is FactoryStatesV1 {
    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier notPaused() {
        _notPaused();
        _;
    }

    modifier authorized(address _address) {
        _authorized(_address);
        _;
    }

    modifier notBlacklisted(address _address) {
        _notBlacklisted(_address);
        _;
    }

    modifier checkInputsCreateCampaign(
        bytes32 name,
        string memory description,
        uint256 minimum,
        uint256 contributionPeriod
    ) {
        _checkInputsCreateCampaign(name, description, minimum, contributionPeriod);
        _;
    }

    function _onlyOwner() internal view {
        require(msg.sender == factoryStatus.owner, 'only owner can do this task');
    }

    function _notPaused() internal view {
        require(!factoryStatus.isPaused, 'Factory is already Paused');
    }

    function _authorized(address _address) internal view {
        require(managerStatus[_address].isAuthorized || msg.sender == factoryStatus.owner, '!Authorized');
    }

    function _notBlacklisted(address _address) internal view {
        require(!managerStatus[_address].isBlacklisted, 'Blacklisted');
    }

    function _checkInputsCreateCampaign(
        bytes32 name,
        string memory description,
        uint256 minimum,
        uint256 contributionPeriod
    ) internal view {
        FactoryStatus memory mFactoryStatus = factoryStatus;

        require(minimum >= 0.01 ether && minimum % 0.01 ether == 0, 'minimum unit is 0.01 ether');
        require(msg.value >= mFactoryStatus.tax, '!Tax');
        require(name.length <= mFactoryStatus.maxNameLength, 'Campaign Name is too Big');
        require(bytes(description).length <= mFactoryStatus.maxDescriptionLength, 'Campaign Description is too Big');
        require(contributionPeriod <= mFactoryStatus.maxContributionPeriod * (30 * 24 * 60 * 60), 'contribution period must be lt 6 mounths');
    }
}
