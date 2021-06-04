// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

/// @title  The events for the Primitive Engine contract
/// @author Primitive

interface IPrimitiveEngineEvents {
    /// @notice Creates a new calibrated curve and initialized its liquidity
    /// @param  from    The calling `msg.sender` of the create function
    /// @param  pid     The keccak hash of the option parameters of a curve to interact with
    /// @param  strike  The strike price of the option of the curve to calibrate to
    /// @param  sigma   The volatility of the option of the curve to calibrate to
    /// @param  time    The time until expiry of the option of the curve to calibrate to
    event Create(address indexed from, bytes32 indexed pid, uint strike, uint sigma, uint time);

    /// @notice Sets new global reserve values of the risky and stable token of a pool/curve with `pid`
    /// @param  pid             The pool that is being updated
    /// @param  reserveRisky    The new global reserve value of the risky token
    /// @param  reserveStable   The new global reserve value of the stable token
    /// @param  blockNumber     The block.number of the call
    event Updated(bytes32 pid, uint reserveRisky, uint reserveStable, uint blockNumber);
    
    // ===== Margin ====
    /// @notice Added stable and/or risky tokens to a margin accouynt
    /// @param  from    The calling `msg.sender`
    /// @param  owner   The recipient margin account owner
    /// @param  deltaX  The amount of risky tokens deposited
    /// @param  deltaY  The amount of stable tokens deposited
    event Deposited(address indexed from, address indexed owner, uint deltaX, uint deltaY);
    event Withdrawn(address indexed from, uint deltaX, uint deltaY);
    
    // ===== Liquidity =====
    /// @notice Adds liquidity of risky and stable tokens to a specified curve `pid`
    /// @param  from   The calling `msg.sender`
    /// @param  deltaX  The amount of risky tokens deposited
    /// @param  deltaY  The amount of stable tokens deposited
    event Allocated(address indexed from, uint deltaX, uint deltaY);

    /// @notice Adds liquidity of risky and stable tokens to a specified curve `pid`
    /// @param  from   The calling `msg.sender`
    /// @param  deltaX  The amount of risky tokens deposited
    /// @param  deltaY  The amount of stable tokens deposited
    event Removed(address indexed from, uint deltaX, uint deltaY);
    
    // ===== Swaps =====
    /// @notice Swaps either risky for stable tokens or stable for risky.
    /// @param  from    TThe calling `msg.sender`
    /// @param  pid     The keccak hash of the option parameters of a curve to interact with
    /// @param  addXRemoveY  If true, a swap from the risky token to the stable token
    /// @param  deltaIn  The amount of tokens paid
    /// @param  deltaOut The amount of tokens received
    event Swap(address indexed from, bytes32 indexed pid, bool indexed addXRemoveY, uint deltaIn, uint deltaOut);
    
    // ===== Lending =====
    /// @notice Liquidity shares added to the float to be borrowed
    /// @param  from   The calling `msg.sender`
    /// @param  pid     The keccak hash of the option parameters of a curve to interact with
    /// @param  deltaL  The amount of liquidity shares loaned
    event Loaned(address indexed from, bytes32 indexed pid, uint deltaL);

    /// @notice Liquidity shares removed from the float
    /// @param  from   The calling `msg.sender`
    /// @param  pid     The keccak hash of the option parameters of a curve to interact with
    /// @param  deltaL  The amount of liquidity shares removed from the float
    event Claimed(address indexed from, bytes32 indexed pid, uint deltaL);

    /// @notice Adds liqidity shares to a `recipient`'s position while adding an equal amount of debt
    /// @param  recipient The owner of the position which receives liquidity shares
    /// @param  pid     The keccak hash of the option parameters of a curve to interact with
    /// @param  deltaL The amount of liquidity shares borrowed, and added as debt
    /// @param  maxPremium  The maximum amount of risky tokens to pay as a `premium` to collateralize the position
    event Borrowed(address indexed recipient, bytes32 indexed pid, uint deltaL, uint maxPremium);

    /// @notice Repays a borrowed position, reduces liquidity shares of position and debt.
    /// @param  owner   The owner of the position to repay
    /// @param  pid     The keccak hash of the option parameters of a curve to interact with
    /// @param  deltaL  The amount of liquidity to pay
    event Repaid(address indexed owner, bytes32 indexed pid, uint deltaL);

    // ===== Flash =====
    /// @notice Optimistically sends risky and/or stable tokens out of the contract, and expects them to be paid back
    /// @dev    https://eips.ethereum.org/EIPS/eip-3156
    event Flash(address indexed from, address indexed receiver, address indexed token, uint amount, uint payment);
}