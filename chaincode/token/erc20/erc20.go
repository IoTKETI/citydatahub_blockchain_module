package erc20

import (
	"strconv"

	"github.com/pkg/errors"
	"github.com/s7techlab/cckit/identity"
	r "github.com/s7techlab/cckit/router"
)

const (
	BalancePrefix   = `BALANCE`
	AllowancePrefix = `APPROVE`
	SignInPrefix    = `SIGNIN`
)

var (
	ErrNotEnoughFunds                   = errors.New(`not enough funds`)
	ErrForbiddenToTransferToSameAccount = errors.New(`forbidden to transfer to same account`)
	ErrSpenderNotHaveAllowance          = errors.New(`spender not have allowance for amount`)
	ErrEmptyUserVariable								= errors.New(`empty user variable`)
	ErrEmptyAmountVariable							= errors.New(`empty amount variable`)
	ErrCallByOnlyAdmin									= errors.New(`this function is called by only admin`)
	ErrSameInvokerAndFrom								= errors.New(`use the transfer because of same ID (invoker and from)`)
	ErrDonotSendSelf										= errors.New(`do not send self`)
)

type (
	Transfer struct {
		From   identity.Id
		To     identity.Id
		Amount int
	}

	Approve struct {
		From    identity.Id
		Spender identity.Id
		Amount  int
	}
)

func invokeInitUser(c r.Context) (interface{}, error) {
	userMspId := c.ParamString(`userMspId`)
	userId := c.ParamString(`userId`)

	if err := setBalance(c, userMspId, userId, 0); err != nil {
		return nil, errors.Wrap(err, `init user`)
	}

	return true, nil
}

func invokeSignIn(c r.Context) (interface{}, error) {
	userMspId := c.ParamString(`userMspId`)
	userId := c.ParamString(`userId`)

	if err := setSignIn(c, userMspId, userId); err != nil {
		return nil, errors.Wrap(err, `sign in user`)
	}

	return true, nil
}

func invokeGenerate(c r.Context) (interface{}, error) {
	amount := c.ParamInt(`ammount`)

	if amount == 0 {
		return nil, ErrEmptyAmountVariable
	}

	totalVal, _ := c.State().GetInt(TotalSupplyKey, 0)
	totalVal += amount

	invokerBalance, err := getBalance(c, OwnerMSP, OwnerID)

	if err != nil {
		return nil, err
	}

	if err := setBalance(c, OwnerMSP, OwnerID, invokerBalance+c.ParamInt(`ammount`)); err != nil {
		return nil, errors.Wrap(err, `set owner initial balance`)
	}

	c.State().Put(TotalSupplyKey, totalVal)

	return totalVal, nil
}

func querySymbol(c r.Context) (interface{}, error) {
	return c.State().Get(SymbolKey)
}

func queryName(c r.Context) (interface{}, error) {
	return c.State().Get(NameKey)
}

func queryTotalSupply(c r.Context) (interface{}, error) {
	return c.State().Get(TotalSupplyKey)
}

func queryBalanceOf(c r.Context) (interface{}, error) {
	return getBalance(c, c.ArgString(`mspId`), c.ArgString(`id`))
}

func invokeTransfer(c r.Context) (interface{}, error) {
	fromMspId := c.ParamString(`fromMspId`)
	fromId := c.ParamString(`fromId`)
	toMspId := c.ParamString(`toMspId`)
	toId := c.ParamString(`toId`)

	amount := c.ParamInt(`amount`)

	if fromId != "admin" {
		return nil, ErrCallByOnlyAdmin
	}

	if (fromId == "" || toId == "" || fromId == "sampleAdmin" || fromId == "sampleUser") {
		return nil, ErrEmptyUserVariable
	}

	if amount == 0 {
		return nil, ErrEmptyAmountVariable
	}

	if fromMspId == toMspId && fromId == toId {
		return nil, ErrForbiddenToTransferToSameAccount
	}

	invokerBalance, err := getBalance(c, fromMspId, fromId)
	if err != nil {
		return nil, err
	}

	if invokerBalance-amount < 0 {
		return nil, ErrNotEnoughFunds
	}

	recipientBalance, err := getBalance(c, toMspId, toId)
	if err != nil {
		return nil, err
	}

	if err = setBalance(c, fromMspId, fromId, invokerBalance-amount); err != nil {
		return nil, err
	}

	if err = setBalance(c, toMspId, toId, recipientBalance+amount); err != nil {
		return nil, err
	}

	if err = c.SetEvent(`transfer`, &Transfer{
		From: identity.Id{
			MSP:  fromMspId,
			Cert: fromId,
		},
		To: identity.Id{
			MSP:  toMspId,
			Cert: toId,
		},
		Amount: amount,
	}); err != nil {
		return nil, err
	}

	return invokerBalance - amount, nil
}

func queryAllowance(c r.Context) (interface{}, error) {
	ownerMspId := c.ParamString(`ownerMspId`)
	ownerId := c.ParamString(`ownerId`)
	spenderMspId := c.ParamString(`spenderMspId`)
	spenderId := c.ParamString(`spenderId`)
	if (spenderId == "" || ownerId == "" || spenderId == "sampleAdmin" || ownerId == "sampleUser") {
		return nil, ErrEmptyUserVariable
	}

	if ownerMspId == spenderMspId && spenderId == ownerId {
		return nil, ErrForbiddenToTransferToSameAccount
	}
	
	allowanceAmount, err := getAllowance(c, ownerMspId, ownerId, spenderMspId, spenderId)
	if err != nil {
		return nil, err
	}
	resMsg := strconv.Itoa(allowanceAmount) + " is the allownace of " + spenderId + " for " + ownerId

	return resMsg, nil
}

func invokeApprove(c r.Context) (interface{}, error) {
	ownerMspId := c.ParamString(`ownerMspId`)
	ownerId := c.ParamString(`ownerId`)
	spenderMspId := c.ParamString(`spenderMspId`)
	spenderId := c.ParamString(`spenderId`)
	amount := c.ParamInt(`amount`)

	if (spenderId == "" || ownerId == "" || spenderId == "sampleAdmin" || ownerId == "sampleUser") {
		return nil, ErrEmptyUserVariable
	}

	if amount == 0 {
		return nil, ErrEmptyAmountVariable
	}

	if ownerMspId == spenderMspId && spenderId == ownerId {
		return nil, ErrForbiddenToTransferToSameAccount
	}

	_, err := identity.FromStub(c.Stub())
	if err != nil {
		return nil, err
	}

	if err = setAllowance(c, ownerMspId, ownerId, spenderMspId, spenderId, amount); err != nil {
		return nil, err
	}

	if err = c.SetEvent(`approve`, &Approve{
		From: identity.Id{
			MSP:  ownerMspId,
			Cert: ownerId,
		},
		Spender: identity.Id{
			MSP:  spenderMspId,
			Cert: spenderId,
		},
		Amount: amount,
	}); err != nil {
		return nil, err
	}

	return true, nil
}

func invokeTransferFrom(c r.Context) (interface{}, error) {

	invokerMspId := c.ParamString(`invokerMspId`)
	invokerId := c.ParamString(`invokerId`)
	fromMspId := c.ParamString(`fromMspId`)
	fromId := c.ParamString(`fromId`)
	toMspId := c.ParamString(`toMspId`)
	toId := c.ParamString(`toId`)
	amount := c.ParamInt(`amount`)

	if (invokerId == "" || fromId == "" || toId == "sampleAdmin" || invokerId == "sampleAdmin" || fromId == "sampleUser1"|| toId == "sampleUser2") {
		return nil, ErrEmptyUserVariable
	}

	if invokerMspId == fromMspId && invokerId == fromId {
		return nil, ErrSameInvokerAndFrom
	}

	if invokerMspId == toMspId && invokerId == toId {
		return nil, ErrDonotSendSelf
	}

	if amount == 0 {
		return nil, ErrEmptyAmountVariable
	}

	if fromMspId == toMspId && toId == fromId {
		return nil, ErrForbiddenToTransferToSameAccount
	}

	_, err := identity.FromStub(c.Stub())
	if err != nil {
		return nil, err
	}

	allowance, err := getAllowance(c, fromMspId, fromId, invokerMspId, invokerId)
	if err != nil {
		return nil, err
	}

	if allowance < amount {
		return nil, ErrSpenderNotHaveAllowance
	}

	balance, err := getBalance(c, fromMspId, fromId)
	if err != nil {
		return nil, err
	}

	if balance-amount < 0 {
		return nil, ErrNotEnoughFunds
	}

	recipientBalance, err := getBalance(c, toMspId, toId)
	if err != nil {
		return nil, err
	}

	if err = setBalance(c, fromMspId, fromId, balance-amount); err != nil {
		return nil, err
	}

	if err = setBalance(c, toMspId, toId, recipientBalance+amount); err != nil {
		return nil, err
	}

	if err = setAllowance(c, fromMspId, fromId, invokerMspId, invokerId, allowance-amount); err != nil {
		return nil, err
	}

	if err = c.Event().Set(`transfer`, &Transfer{
		From: identity.Id{
			MSP:  fromMspId,
			Cert: fromId,
		},
		To: identity.Id{
			MSP:  toMspId,
			Cert: toId,
		},
		Amount: amount,
	}); err != nil {
		return nil, err
	}

	return balance - amount, nil
}

func balanceKey(mspId, userId string) []string {
	return []string{BalancePrefix, mspId, userId}
}

func allowanceKey(ownerMspId, ownerId, spenderMspId, spenderId string) []string {
	return []string{AllowancePrefix, ownerMspId, ownerId, spenderMspId, spenderId}
}

func signInKey(mspId, userId string) []string {
	return []string{SignInPrefix, mspId, userId}
}

func getBalance(c r.Context, mspId, userId string) (int, error) {
	return c.State().GetInt(balanceKey(mspId, userId), 0)
}

func setBalance(c r.Context, mspId, userId string, balance int) error {
	return c.State().Put(balanceKey(mspId, userId), balance)
}

func getAllowance(c r.Context, ownerMspId, ownerId, spenderMspId, spenderId string) (int, error) {
	return c.State().GetInt(allowanceKey(ownerMspId, ownerId, spenderMspId, spenderId), 0)
}

func setAllowance(c r.Context, ownerMspId, ownerId, spenderMspId, spenderId string, amount int) error {
	return c.State().Put(allowanceKey(ownerMspId, ownerId, spenderMspId, spenderId), amount)
}

func setSignIn(c r.Context, mspId, userId string) error {
	return c.State().Put(signInKey(mspId, userId), userId)
}
