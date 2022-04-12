package main

import (
	"fmt"

	"github.com/chaincode/token/erc20"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

func main() {
	err := shim.Start(erc20.NewErc20FixedSupply())
	if err != nil {
		fmt.Printf("Error starting ERC-20 chaincode: %s", err)
	}
}
