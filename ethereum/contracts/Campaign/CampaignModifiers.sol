// SPDX-License-Identifier: MIT
import './CampaignStates.sol';

pragma solidity ^0.8.13;

abstract contract CampaignModifiers is CampaignStates {
    modifier noReentrant() {
        require(!locked, 'No re-entrancy');
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwnerFactory() {
        require(msg.sender == owner || msg.sender == factory, 'only owner can call this function');
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, 'only manager can call this function');
        _;
    }

    modifier onlyInvestor() {
        require(isInvestor[msg.sender], 'only investor can call this function');
        _;
    }

    function _notClosed() internal view {
        require(!isRejectedByOwner && !isClosed, 'campaign is not available anymore');
    }

    modifier notClosed() {
        _notClosed();
        _;
    }
}
