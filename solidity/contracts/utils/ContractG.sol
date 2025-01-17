pragma solidity ^0.8.0;

/**
 * @notice This contract is for testing complex data structures with mappings using them
 *  - Structs with nestep mapings
 *  - Nested structs
 *  - Nested structs arrays
 *  - Structs with multiple structs
 */
contract ContractG {
  struct Set {
    bytes32[] _values;
    mapping(bytes32 value => uint256) _positions;
  }

  struct AddressSet {
    Set _inner;
  }

  struct AddressSets {
    Set[] _inner;
  }

  struct CommonStruct {
    uint256 _value;
  }

  struct ComplexStruct {
    string _name;
    CommonStruct _common;
    AddressSet _addressSet;
    Set _set;
  }

  struct NestedStruct {
    uint256 _counter;
    CommonStruct _common;
  }

  mapping(bytes32 _disputeId => bool _finished) public finished;

  mapping(bytes32 _disputeId => bool _finished) internal _finishedInternal;

  mapping(bytes32 _key1 => mapping(bytes32 _key2 => bool _finished)) internal _doubleFinishedInternal;

  mapping(bytes32 _disputeId => Set _votersSet) internal _votersA;

  mapping(bytes32 _disputeId => mapping(address => Set _votersSet)) internal _votersB;

  mapping(bytes32 _disputeId => AddressSet _votersSet) internal _votersC;

  mapping(bytes32 _disputeId => AddressSets _votersSets) internal _votersD;

  mapping(bytes32 _disputeId => ComplexStruct _complexStruct) internal _complexStructs;

  mapping(bytes32 _disputeId => NestedStruct _nestedStruct) public _nestedStructs;

  mapping(bytes32 _disputeId => NestedStruct _nestedStruct) internal _nestedStructsInternal;

  NestedStruct public nestedStruct;

  CommonStruct[] public structArray;

  CommonStruct[] internal _structArrayInternal;

  CommonStruct[][] public twoDimensionalStruct;

  CommonStruct[][][] public threeDimensionalStruct;

  uint256[][] public twoDimensionalArray;

  string[][] public twoDimensionalStringArray;

  uint256[][][] public threeDimensionalArray;

  function setNestedStruct(NestedStruct memory _nestedStruct) public {
    nestedStruct = _nestedStruct;
  }
}
