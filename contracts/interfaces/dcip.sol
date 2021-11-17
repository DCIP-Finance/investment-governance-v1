//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IDCIP {
    function transfer(address to, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);

    function decimals() external pure returns (uint8);
}
