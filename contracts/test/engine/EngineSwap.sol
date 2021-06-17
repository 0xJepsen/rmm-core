// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

import "../../interfaces/IPrimitiveEngine.sol";
import "../../interfaces/IERC20.sol";

contract EngineSwap {
    address public engine;
    address public risky;
    address public stable;
    address public CALLER;

    constructor() {}

    function initialize(
        address _engine,
        address _risky,
        address _stable
    ) public {
        engine = _engine;
        risky = _risky;
        stable = _stable;
    }

    function swap(
        bytes32 pid,
        bool riskyForStable,
        uint256 deltaOut,
        uint256 deltaInMax,
        bool fromMargin,
        bytes calldata data
    ) public {
        CALLER = msg.sender;
        IPrimitiveEngine(engine).swap(pid, riskyForStable, deltaOut, deltaInMax, fromMargin, data);
    }

    function swapCallback(
        uint256 deltaX,
        uint256 deltaY,
        bytes calldata data
    ) public {
        IERC20(risky).transferFrom(CALLER, engine, deltaX);
        IERC20(stable).transferFrom(CALLER, engine, deltaY);
    }

    function name() public pure returns (string memory) {
        return "EngineSwap";
    }
}