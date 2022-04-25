// SPDX-License-Identifier: MIT
import './FactoryStatesV2.sol';

pragma solidity ^0.8.13;

abstract contract FactoryLogicsV2 is FactoryStatesV2 {
    function _Pause() internal {
        factoryStatus.isPaused = true;
        emit Paused();
    }

    function _unPause() internal {
        require(factoryStatus.isPaused == true, 'Factory is already not Paused');
        factoryStatus.isPaused = false;
        emit unPaused();
    }

    function _setTax(uint64 _tax) internal {
        factoryStatus.tax = _tax;
        emit SetTax(factoryStatus.tax);
    }

    function _authorize(address _authorizedAddress) internal {
        require(!managerStatus[_authorizedAddress].isAuthorized, 'already authorized');

        managerStatus[_authorizedAddress].isAuthorized = true;
        emit Authorized(_authorizedAddress);
    }

    function _blacklist(address _blacklistedAddress) internal {
        require(!managerStatus[_blacklistedAddress].isBlacklisted, 'already blacklisted');

        managerStatus[_blacklistedAddress].isBlacklisted = true;
        emit Blacklisted(_blacklistedAddress);
    }

    function _createCampaign(
        bytes32 name,
        string memory description,
        string memory banner,
        uint256 minimum,
        uint256 contributionPeriod
    ) internal {
        // Campaign newCampaign = new Campaign(factoryStatus.owner, payable(address(this)), name, description, banner, uint64(minimum), uint32(contributionPeriod), msg.sender);

        //   address payable _owner,
        //     address payable _factory,
        //     bytes32 _name,
        //     string memory _description,
        //     string memory _banner,
        //     uint64 _minimum,
        //     uint32 _contributionPeriod,
        //     address _manager

        Campaign newCampaign = Campaign(
            payable(_createClone(cloneStatus.campaignAddress, abi.encodeWithSelector(Campaign.initialize.selector, factoryStatus.owner, payable(address(this)), cloneStatus.tokenAddress, cloneStatus.poolAddress, name, description, banner, uint64(minimum), uint32(contributionPeriod), msg.sender)))
        );
        Campaigns.push(address(newCampaign));
        campaignStatus[address(newCampaign)].campaignTokenAddress = newCampaign.campaignTokenAddress();

        emit CreateCampaignLog('successfully created', address(newCampaign), campaignStatus[address(newCampaign)].campaignTokenAddress, Campaigns.length);
    }

    function _getCampaigns() internal view returns (address[] memory) {
        return Campaigns;
    }

    function _rejectCampaign(address rejectedAddress) internal {
        require(!campaignStatus[rejectedAddress].isRejected, 'this campaign is already rejected');
        (bool success, bytes memory result) = rejectedAddress.call(abi.encodeWithSignature('rejectCampaign()'));
        require(success, 'rejection failed');
        address resultAddress = abi.decode(result, (address));
        campaignStatus[rejectedAddress].campaignRejectionPoolAddress = resultAddress;
        campaignStatus[rejectedAddress].isRejected = true;

        emit CampaignRejectionLog(rejectedAddress, resultAddress);
    }

    function _withdrawTaxFees() internal {
        factoryStatus.owner.transfer(address(this).balance);
        emit TransferTax(address(this).balance);
    }
}
