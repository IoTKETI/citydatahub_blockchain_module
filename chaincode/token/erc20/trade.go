package erc20

import (
	"bytes"
	"fmt"
	"strconv"
	"strings"
	"time"

	"encoding/json"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	r "github.com/s7techlab/cckit/router"
)

type (
	Incentive struct {
		DocType    string `json:"docType"`
		BuyerId    string `json:"buyerId"`
		SellerId   string `json:"sellerId"`
		Amount     string `json:"amount"`
		Additional string `json:"additional"`
		Time       string `json:"time"`
	}
)

func tradeKey(num string) []string {
	return []string{num}
}

func generateStateKey(fromId string, toId string, timestamp string) string {
	return fromId + "+" + toId + "+" + timestamp
}

func invokeTransferWithHistory(c r.Context) (interface{}, error) {
	docType := "incentive"
	fromMspId := c.ParamString(`fromMspId`)
	fromId := c.ParamString(`fromId`)
	toMspId := c.ParamString(`toMspId`)
	toId := c.ParamString(`toId`)
	amount := c.ParamInt(`amount`)
	additional := c.ParamString(`additional`)

	tval := strconv.FormatInt(time.Now().UTC().In(time.FixedZone("KST", 9*60*60)).Unix(), 10)

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

	incentive := &Incentive{docType, fromId, toId, strconv.Itoa(amount), additional, tval}
	tradeJSONasBytes, err := json.Marshal(incentive)

	if err != nil {
		return nil, err
	}

	err = c.Stub().PutState(generateStateKey(fromId, toId, tval), tradeJSONasBytes)

	if err != nil {
		return nil, err
	}

	return true, nil

}

func queryIncentiveAllHistory(c r.Context) (interface{}, error) {

	docType := "incentive"
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"%s\"}}", docType)

	queryResults, err := getQueryResultForQueryString(c.Stub(), queryString)

	if err != nil {
		return nil, err
	}

	return queryResults, nil
}

func queryIncentiveHistoryByUser(c r.Context) (interface{}, error) {
	docType := "incentive"
	userId := c.ParamString(`userId`)
	termStart := c.ParamString(`termStart`)
	termEnd := c.ParamString(`termEnd`)
	queryString := ""

	if termStart == "*" && termEnd == "*" {
		queryString = fmt.Sprintf("{\"selector\":{\"docType\":\"%s\", \"$and\":[{\"$or\":[{\"buyerId\":\"%s\"},{\"sellerId\":\"%s\"}]}]}}", docType, userId, userId)
	} else {
		if termStart != "*" && termEnd != "*" {
			queryString = fmt.Sprintf("{\"selector\":{\"docType\":\"%s\", \"$and\":[{\"time\":{\"$gte\":\"%s\", \"$lte\":\"%s\"}}, {\"$or\":[{\"buyerId\":\"%s\"},{\"sellerId\":\"%s\"}]}]}}", docType, termStart, termEnd, userId, userId)
		} else if termStart != "*" && termStart == "*" {
			queryString = fmt.Sprintf("{\"selector\":{\"docType\":\"%s\", \"$and\":[{\"time\":{\"$gte\":\"%s\"}}, {\"$or\":[{\"buyerId\":\"%s\"},{\"sellerId\":\"%s\"}]}]}}", docType, termStart, userId, userId)
		} else if termEnd != "*" {
			queryString = fmt.Sprintf("{\"selector\":{\"docType\":\"%s\", \"$and\":[{\"time\":{\"$lte\":\"%s\"}}, {\"$or\":[{\"buyerId\":\"%s\"},{\"sellerId\":\"%s\"}]}]}}", docType, termEnd, userId, userId)
		}
	}

	queryResults, err := getQueryResultForQueryString(c.Stub(), queryString)
	if err != nil {
		return nil, err
	}

	return queryResults, nil
}

func getQueryResultForQueryString(stub shim.ChaincodeStubInterface, queryString string) (interface{}, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	buffer, err := constructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return nil, err
	}

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", buffer.String())

	return buffer.String(), nil
}

func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) (*bytes.Buffer, error) {
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	replacer := strings.NewReplacer(`\`, ``, `"{`, `{`, `}"`, `}`)

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString(`{"id":`)
		buffer.WriteString(`"`)
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString(`"`)

		buffer.WriteString(`, "record":`)
		if queryResponse.Key == "time" {
			i, err := strconv.ParseInt(string(queryResponse.Value), 10, 64)

			if err != nil {
				panic(err)
			}

			tm := time.Unix(i, 0).UTC().String()

			buffer.WriteString(tm)

			if err != nil {
				buffer.WriteString(string(queryResponse.Value))
			}

		} else {
			tmp := replacer.Replace(string(queryResponse.Value))
			fmt.Printf("- test queryString:\n%s\n", tmp)
			buffer.WriteString(tmp)
		}

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	return &buffer, nil
}
