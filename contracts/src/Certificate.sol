// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface ICertificate {
    function mint(address to, uint256 tokenId) external;
    function hasCertificate(address user, uint256 tokenId) external view returns (bool);
    function getCertificates(address user) external view returns (uint256[] memory);
}

contract Certificate is ICertificate {
    address public progressTracker;
    address public migrator;
    
    mapping(uint256 => uint256) public milestoneToTokenId;
    mapping(uint256 => string) public tokenIdToURI;
    mapping(address => mapping(uint256 => bool)) private certificates;
    mapping(address => uint256[]) private userCertificates;
    mapping(uint256 => address) private tokenOwners;
    
    uint256[] public milestones;
    uint256 public totalCertificates;
    
    string public constant name = "Trident Challenge Certificates";
    string public constant symbol = "TCC";
    
    bytes4 private constant ERC165_INTERFACE_ID = 0x01ffc9a7;
    bytes4 private constant ERC721_INTERFACE_ID = 0x80ac58cd;
    bytes4 private constant ERC721_METADATA_INTERFACE_ID = 0x5b5e139f;
    bytes4 private constant ERC721_ENUMERABLE_INTERFACE_ID = 0x780e9d63;
    
    error Unauthorized();
    error CertificateAlreadyMinted();
    error InvalidTokenId();
    error SoulboundToken();
    error TokenNotFound();
    
    event CertificateMinted(address indexed to, uint256 indexed tokenId, uint256 milestone);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    
    constructor() {
        milestones = [5, 10, 20];
        
        for (uint256 i = 0; i < milestones.length; i++) {
            milestoneToTokenId[milestones[i]] = i + 1;
            totalCertificates++;
        }
        
        tokenIdToURI[1] = "ipfs://QmCertificate5";
        tokenIdToURI[2] = "ipfs://QmCertificate10";
        tokenIdToURI[3] = "ipfs://QmCertificate20";
    }
    
    function setProgressTracker(address _progressTracker) external {
        if (progressTracker != address(0)) revert Unauthorized();
        progressTracker = _progressTracker;
    }
    
    function setMigrator(address _migrator) external {
        if (migrator != address(0)) revert Unauthorized();
        migrator = _migrator;
    }
    
    function mint(address to, uint256 tokenId) external {
        if (msg.sender != progressTracker && msg.sender != migrator) revert Unauthorized();
        if (tokenId == 0 || tokenId > totalCertificates) revert InvalidTokenId();
        if (certificates[to][tokenId]) revert CertificateAlreadyMinted();
        
        certificates[to][tokenId] = true;
        userCertificates[to].push(tokenId);
        tokenOwners[tokenId] = to;
        
        uint256 milestone = getMilestoneForTokenId(tokenId);
        emit CertificateMinted(to, tokenId, milestone);
        emit Transfer(address(0), to, tokenId);
    }
    
    function hasCertificate(address user, uint256 tokenId) external view returns (bool) {
        return certificates[user][tokenId];
    }
    
    function getCertificates(address user) external view returns (uint256[] memory) {
        return userCertificates[user];
    }
    
    function getMilestoneForTokenId(uint256 tokenId) public view returns (uint256) {
        if (tokenId == 0 || tokenId > milestones.length) revert InvalidTokenId();
        return milestones[tokenId - 1];
    }
    
    function getTokenIdForMilestone(uint256 milestone) external view returns (uint256) {
        return milestoneToTokenId[milestone];
    }
    
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (tokenId == 0 || tokenId > totalCertificates) revert InvalidTokenId();
        return tokenIdToURI[tokenId];
    }
    
    function balanceOf(address owner) external view returns (uint256) {
        return userCertificates[owner].length;
    }
    
    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = tokenOwners[tokenId];
        if (owner == address(0)) revert TokenNotFound();
        return owner;
    }
    
    function transferFrom(address, address, uint256) external pure {
        revert SoulboundToken();
    }
    
    function safeTransferFrom(address, address, uint256) external pure {
        revert SoulboundToken();
    }
    
    function safeTransferFrom(address, address, uint256, bytes memory) external pure {
        revert SoulboundToken();
    }
    
    function approve(address, uint256) external pure {
        revert SoulboundToken();
    }
    
    function setApprovalForAll(address, bool) external pure {
        revert SoulboundToken();
    }
    
    function getApproved(uint256) external pure returns (address) {
        revert SoulboundToken();
    }
    
    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }
    
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == ERC165_INTERFACE_ID ||
               interfaceId == ERC721_INTERFACE_ID ||
               interfaceId == ERC721_METADATA_INTERFACE_ID ||
               interfaceId == ERC721_ENUMERABLE_INTERFACE_ID;
    }
    
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256) {
        if (index >= userCertificates[owner].length) revert InvalidTokenId();
        return userCertificates[owner][index];
    }
    
    function totalSupply() external view returns (uint256) {
        return totalCertificates;
    }
}

