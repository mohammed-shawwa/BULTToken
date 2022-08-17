// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;


import "@openzeppelin/contracts/utils/Context.sol";
import "./interfaces/ITNT20.sol";
import "./math/SafeMath.sol";

contract BULTToken is Context, ITNT20 {
    using SafeMath for uint256;

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    address private _admin;
    uint256 public time;
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;
    bool private _mintable;

     constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_,
        bool mintable_
    )  {
        require(msg.sender != address(0x0), "cannot deploy the token from address 0x0");
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _admin = msg.sender;
        _mint(_admin, initialSupply_ * 10**_decimals);
        _mintable = mintable_;
        time = block.timestamp;
    }

    function getAdmin() public view returns (address) {
        return _admin;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount)
    public
    virtual
    override
    returns (bool)
    {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender)
    public
    view
    virtual
    override
    returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount)
    public
    virtual
    override
    returns (bool)
    {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(
            sender,
            _msgSender(),
            _allowances[sender][_msgSender()].sub(
                amount,
                "TNT20: transfer amount exceeds allowance"
            )
        );
        return true;
    }

    function mintable() public view returns (bool) {
        return _mintable;
    }

    function mint(uint256 amount) public returns (bool) {
        require(_mintable, "the token is not mintable");
        require(msg.sender == _admin, "only admin can mint new tokens");
        _mint(_admin, amount);
        return true;
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {
        require(sender != address(0), "TNT20: transfer from the zero address");
        require(recipient != address(0), "TNT20: transfer to the zero address");

        _balances[sender] = _balances[sender].sub(
            amount,
            "TNT20: transfer amount exceeds balance"
        );
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "TNT20: mint to the zero address");

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "TNT20: burn from the zero address");

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount ,"TNT20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(account, address(0), amount);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), "TNT20: approve from the zero address");
        require(spender != address(0), "TNT20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function burn(uint _value) public virtual override returns (bool sucess) {
        _burn(_msgSender() , _value);
        return true;
    } 
}
