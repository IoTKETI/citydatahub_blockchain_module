package erc20

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/s7techlab/cckit/extensions/owner"
	"github.com/s7techlab/cckit/router"
	p "github.com/s7techlab/cckit/router/param"
)

const SymbolKey = `symbol`
const NameKey = `name`
const TotalSupplyKey = `totalSupply`
const OwnerMSP = `n2mMSP`
const OwnerID = `admin`

func NewErc20FixedSupply() *router.Chaincode {
	fmt.Printf("Init Power Related Chaincode \n")
	r := router.New(`erc20fixedSupply`).Use(p.StrictKnown).
		Init(invokeInitFixedSupply, p.String(`symbol`), p.String(`name`), p.Int(`totalSupply`)).
		Invoke(`generate`, invokeGenerate, p.Int(`ammount`)).
		Invoke(`signIn`, invokeSignIn, p.String(`userMspId`), p.String(`userId`)).
		Query(`symbol`, querySymbol).
		Query(`name`, queryName).
		Query(`totalSupply`, queryTotalSupply).
		Query(`balanceOf`, queryBalanceOf, p.String(`mspId`), p.String(`id`)).
		Invoke(`transfer`, invokeTransfer, p.String(`fromMspId`), p.String(`fromId`), p.String(`toMspId`), p.String(`toId`), p.Int(`amount`)).
		Invoke(`approve`, invokeApprove, p.String(`ownerMspId`), p.String(`ownerId`), p.String(`spenderMspId`), p.String(`spenderId`), p.Int(`amount`)).
		Query(`allowance`, queryAllowance, p.String(`ownerMspId`), p.String(`ownerId`),
			p.String(`spenderMspId`), p.String(`spenderId`)).
		Invoke(`transferFrom`, invokeTransferFrom, p.String(`invokerMspId`), p.String(`invokerId`), p.String(`fromMspId`), p.String(`fromId`),
			p.String(`toMspId`), p.String(`toId`), p.Int(`amount`)).
		Invoke(`invokeTransferWithHistory`, invokeTransferWithHistory, p.String(`fromMspId`), p.String(`fromId`),
			p.String(`toMspId`), p.String(`toId`), p.Int(`amount`), p.String(`additional`)).
		Query(`queryIncentiveHistoryByUser`, queryIncentiveHistoryByUser, p.String(`userId`), p.String(`termStart`), p.String(`termEnd`)).
		Query(`queryIncentiveAllHistory`, queryIncentiveAllHistory).
		Invoke(`initUser`, invokeInitUser, p.String(`userMspId`), p.String(`userId`))

	return router.NewChaincode(r)
}

func invokeInitFixedSupply(c router.Context) (interface{}, error) {

	ownerIdentity, err := owner.SetFromCreator(c)
	if err != nil {
		return nil, errors.Wrap(err, `set chaincode owner`)
	}

	if err := c.State().Insert(SymbolKey, c.ParamString(`symbol`)); err != nil {
		fmt.Printf("token symbol already exist")
	}

	if err := c.State().Insert(NameKey, c.ParamString(`name`)); err != nil {
		fmt.Printf("token name already exist")
	}

	if err := c.State().Insert(TotalSupplyKey, c.ParamInt(`totalSupply`)); err != nil {
		fmt.Printf("token totalSupply already exist")
	}

	fmt.Printf("\n================= Init Token System =================\n")
	fmt.Printf("Token symbol : %s \n", c.ParamString(`symbol`))
	fmt.Printf("Token name : %s \n", c.ParamString(`name`))
	fmt.Printf("Token total supply : %d \n", c.ParamInt(`totalSupply`))
	fmt.Printf("Owner MSPID : %s \n", OwnerMSP)
	fmt.Printf("Owner ID : %s \n", OwnerID)
	fmt.Printf("Owner Subject : %s \nOwner PEM : \n%s", ownerIdentity.GetSubject(), ownerIdentity.GetPEM())
	fmt.Printf("=====================================================\n")

	if err := setBalance(c, OwnerMSP, OwnerID, c.ParamInt(`totalSupply`)); err != nil {
		return nil, errors.Wrap(err, `set owner initial balance`)
	}

	return ownerIdentity, nil
}
