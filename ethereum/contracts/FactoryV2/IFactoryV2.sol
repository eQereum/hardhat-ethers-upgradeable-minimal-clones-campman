// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IFactoryV2 {
    struct FactoryStatus {
        address payable owner;
        uint64 tax;
        uint8 maxNameLength;
        uint8 maxDescriptionLength;
        uint8 maxContributionPeriod;
        bool isPaused;
    }

    struct CloneStatus {
        address campaignAddress;
        address tokenAddress;
        address poolAddress;
    }

    struct CampaignStatus {
        address campaignTokenAddress;
        address campaignRejectionPoolAddress;
        bool isRejected;
    }

    struct ManagerStatus {
        bool isAuthorized;
        bool isBlacklisted;
    }

    event Paused();
    event unPaused();
    event SetTax(uint64 indexed tax);
    event Authorized(address indexed authorizedAddress);
    event Blacklisted(address indexed blacklistedAddress);
    event CreateCampaignLog(string result, address indexed createdCampaignAddress, address indexed createdCampaignTokenAddress, uint256 indexed number);
    event CampaignRejectionLog(address indexed rejectedAddress, address indexed poolAddress);
    event TransferTax(uint256 indexed amount);

    function Pause() external;

    function unPause() external;

    function setTax(uint64 _tax) external;

    function authorize(address _authorizedAddress) external;

    function blacklist(address _blacklistedAddress) external;

    function createCampaign(
        bytes32 name,
        string memory description,
        string memory banner,
        uint256 minimum,
        uint256 contributionPeriod
    ) external payable;

    function getCampaigns() external view returns (address[] memory);

    function rejectCampaign(address rejectedAddress) external;

    function withdrawTaxFees() external;
}
