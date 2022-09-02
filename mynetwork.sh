#
# SPDX-License-Identifier: Apache-2.0
#

#!/bin/bash

## environment
export PATH=${PWD}/../../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/configtx
export VERBOSE=false

export BDIR=${PWD}/build
export BTDIR=$BDIR/channel-artifacts
export BCDIR=$BTDIR/crypto-config
export BCSDIR=$BCDIR/fabric-ca-server
export BTGDIR=$BTDIR/system-genesis-block
export BTCDIR=$BTDIR/channel

export GDIR=${PWD}/cryptogen

export DDIR=${PWD}/docker

export FTDIR=${PWD}/configtx
export FFDIR=${PWD}/config
export HDIR=${PWD}/chaincode

export CCPDIR=${PWD}/ccp

## variable
COMPOSE_FILE_BASE=$DDIR/docker-compose-base.yaml
COMPOSE_FILE_CA=$DDIR/docker-compose-ca.yaml
COMPOSE_FILE_CLI=$DDIR/docker-compose-cli.yaml

SYS_CHANNEL="marketplace-sys-channel"
CHANNEL_NAME="marketplace-channel"

CA_IMAGETAG="1.4.8"
TOOL_IMAGETAG="1.4.8"

USER="n2m"

CRYPTO="cryptogen"

### cli variable
FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-client
CLI_WORK_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/build
ORDERER_CA=$CLI_WORK_PATH/channel-artifacts/crypto-config/ordererOrganizations/cityhub.org/orderers/orderer0.cityhub.org/msp/tlscacerts/tlsca.cityhub.org-cert.pem
TLS_ENABLED=true
CLI_CHAINCODE_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/

### chaincode variable
CC_NAME="token"
CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/token"
# CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/aesencrypt"
# CC_SRC_PATH=/opt/gopath/src/github.com//chaincode/javascript
CC_SRC_LANGUAGE="NA"
CC_VERSION="v1"
CC_SEQUENCE=1
CC_INIT_FCN="NA"
CC_END_POLICY="NA"
CC_COLL_CONFIG="NA"
CC_RUNTIME_LANGUAGE="golang"

orgs=("n2m" "pnu" "orderer")
users=("jouk" "shinwook" "sangbong" "yul" "donggyu")
caport=("7054" "8054" "9054")

function printHelp() {
  echo "first : ./mychannel.sh up"
  echo "second : ./mychannel.sh createChannel -c dev"
  echo "third : ./mychannel.sh joinChannel -c dev"
  echo "fourth: ./mychannel.sh deployCC -c dev"
}

## function setGlobals
function setGlobals() {
  ORG=$1

  if [ $ORG = "n2m" ]; then
    PPORT="7051"
  elif [ $ORG = "pnu" ]; then
    PPORT="9051"
  else
    "no peer port"
  fi

  LOCALMSPID=${ORG}MSP
  TLS_CERT_FILE=$CLI_WORK_PATH/channel-artifacts/crypto-config/peerOrganizations/${ORG}.cityhub.org/peers/peer0.${ORG}.cityhub.org/tls/server.crt
  TLS_KEY_FILE=$CLI_WORK_PATH/channel-artifacts/crypto-config/peerOrganizations/${ORG}.cityhub.org/peers/peer0.${ORG}.cityhub.org/tls/server.key
  TLS_ROOTCERT_FILE=$CLI_WORK_PATH/channel-artifacts/crypto-config/peerOrganizations/${ORG}.cityhub.org/peers/peer0.${ORG}.cityhub.org/tls/ca.crt
  MSPCONFIGPATH=$CLI_WORK_PATH/channel-artifacts/crypto-config/peerOrganizations/${ORG}.cityhub.org/users/Admin@${ORG}.cityhub.org/msp
  ADDRESS="peer0.${ORG}.cityhub.org:${PPORT}"
}

function generateCerts (){
  mkdir -p $BTDIR
	
	cp ${PWD}/cryptogen/crypto-config.yaml $BTDIR/crypto-config.yaml

	docker run --rm --name fabric-tools \
      -v $BDIR/:$CLI_WORK_PATH \
      -w $CLI_WORK_PATH \
      hyperledger/fabric-tools:${TOOL_IMAGETAG} cryptogen generate --config=$CLI_WORK_PATH/channel-artifacts/crypto-config.yaml --output=$CLI_WORK_PATH/channel-artifacts/"crypto-config"
}

function generateChannelArtifacts() {
  if [ ! -d "$BTGDIR" ]; then
    mkdir -p $BTGDIR
  else
    sudo rm -rf $BTGDIR
    mkdir -p $BTGDIR
  fi
  cp ${PWD}/configtx/configtx.yaml $BTDIR/configtx.yaml

  docker run --rm --name fabric-tools \
    -e FABRIC_CFG_PATH=$CLI_WORK_PATH/channel-artifacts \
    -v $BDIR:$CLI_WORK_PATH \
    -w $CLI_WORK_PATH \
    hyperledger/fabric-tools:${TOOL_IMAGETAG} \
    configtxgen -profile systemChannel -channelID ${SYS_CHANNEL} -outputBlock $CLI_WORK_PATH/channel-artifacts/system-genesis-block/genesis.block

	mkdir -p $BTCDIR
	docker run --rm --name fabric-tools \
    -e FABRIC_CFG_PATH=$CLI_WORK_PATH/channel-artifacts \
    -v $BDIR:$CLI_WORK_PATH \
    -w $CLI_WORK_PATH \
    hyperledger/fabric-tools:${TOOL_IMAGETAG} \
    configtxgen -profile ${CHANNEL_NAME} -outputCreateChannelTx $CLI_WORK_PATH/channel-artifacts/channel/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
	
	for ((i=0;i<${#orgs[@]}-1;i++))
	do
		docker run --rm --name fabric-tools \
			-e FABRIC_CFG_PATH=$CLI_WORK_PATH/channel-artifacts \
			-v $BDIR:$CLI_WORK_PATH \
			-w $CLI_WORK_PATH \
			hyperledger/fabric-tools:${TOOL_IMAGETAG} \
			configtxgen -profile ${CHANNEL_NAME} -outputAnchorPeersUpdate $CLI_WORK_PATH/channel-artifacts/channel/${orgs[i]}MSPanchors.tx -channelID $CHANNEL_NAME -asOrg ${orgs[i]}MSP
	done
}

function networkUp() {
	if [ ! -d "$BDIR" ]; then
    generateCerts
    generateChannelArtifacts
	fi

	COMPOSE_FILES="-f ${COMPOSE_FILE_BASE}"

	SYS_CHANNEL=$SYS_CHANNEL IMAGE_TAG=$IMAGETAG docker-compose $COMPOSE_FILES up -d 2>&1
	docker ps -a

  ## ccp generate
  if [ -e "${CCPDIR}/ccp-generate.sh" ]; then
    docker exec -i -t \
      cli_n2m /bin/bash \
        -c "pushd \"${CLI_CHAINCODE_PATH}/ccp/\" && ./ccp-generate.sh && popd"
  fi

}

## createChannel
function createChannel() {
  cp $FFDIR/core.yaml $BTDIR/core.yaml
  setGlobals ${orgs[0]}
  
  docker exec -i -t \
    -e FABRIC_CFG_PATH=$CLI_WORK_PATH/channel-artifacts \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_ROOT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    cli_n2m peer channel create -o orderer0.cityhub.org:7050 \
                                       -c $CHANNEL_NAME \
                                       -f $CLI_WORK_PATH/channel-artifacts/channel/${CHANNEL_NAME}.tx \
                                       --outputBlock $CLI_WORK_PATH/channel-artifacts/channel/${CHANNEL_NAME}.block \
                                       --tls --cafile $ORDERER_CA
}

function joinChannel() {
  for ((i=0;i<${#orgs[@]}-1;i++))
  do
    setGlobals ${orgs[i]}
    docker exec -i -t \
      -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
      -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
      -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
      -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
      -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
      -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
      -e CORE_PEER_ADDRESS=$ADDRESS \
      cli_n2m peer channel join \
        -b $CLI_WORK_PATH/channel-artifacts/channel/${CHANNEL_NAME}.block
  done
}

function updateAnchorPeers() {
  PEER=$1
  ORG=$2

	setGlobals $ORG
	  docker exec -i -t \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    cli_n2m /bin/bash \
      -c "peer channel update \
        -o orderer0.cityhub.org:7050 \
        -c ${CHANNEL_NAME} \
        -f $CLI_WORK_PATH/channel-artifacts/channel/${LOCALMSPID}anchors.tx \
        --tls --cafile ${ORDERER_CA}"
}

function makeChannel() {
  createChannel
  joinChannel
	for ((i=0;i<${#orgs[@]}-1;i++))
	do
		updateAnchorPeers 0 ${orgs[i]}
	done
}

## deployCC
function setupChaincode() {
  docker exec -i -t \
    cli_n2m /bin/bash \
      -c "mkdir /opt/go/src/github.com/ && \
      cp -r /vendor/github.com/pkg /opt/gopath/src/github.com/ && \
      cp -r /vendor/github.com/s7techlab /opt/gopath/src/github.com/ && \
      cp -r /vendor/github.com/golang /opt/gopath/src/github.com/ && \
      cp -r /vendor/github.com/google.golang.org /opt/gopath/src/ && \

      cp -r /vendor/github.com/pkg /opt/go/src/github.com/ && \
      cp -r /vendor/github.com/s7techlab /opt/go/src/github.com/ && \
      cp -r /vendor/github.com/golang /opt/go/src/github.com/ && \
      cp -r /vendor/github.com/google.golang.org /opt/go/src/"
}

function packageChaincode() {
  setGlobals $1

  docker exec -i -t \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    cli_n2m /bin/bash \
      -c "peer chaincode package -n ${CC_NAME} -p \"github.com/chaincode/${CC_NAME}\" -v ${CC_VERSION} -l ${CC_RUNTIME_LANGUAGE} -s -S -i \"OR ('n2mMSP.member')\" ${CC_NAME}.${CC_VERSION}.out"
}

function signPackageChaincode() {
  setGlobals $1

  docker exec -i -t \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    cli_n2m /bin/bash \
      -c "peer chaincode signpackage ${CC_NAME}.${CC_VERSION}.out sign.${CC_NAME}.${CC_VERSION}.out"
}

function installChaincode() {
  setGlobals $1

  docker exec -i -t \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    cli_n2m /bin/bash \
      -c "peer chaincode install -n ${CC_NAME} -v ${CC_VERSION} -l ${CC_RUNTIME_LANGUAGE} -p \"github.com/chaincode/${CC_NAME}\""
}

function installPackageChaincode() {
  
  setGlobals $1

  docker exec -i -t \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    cli_n2m /bin/bash \
      -c "peer chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/${CC_NAME}.${CC_VERSION}.out"
}

function instantiateChaincode() {
  setGlobals $1

  docker exec -i -t \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    cli_n2m /bin/bash \
      -c "peer chaincode instantiate -o orderer0.cityhub.org:7050 \
				--tls --cafile ${ORDERER_CA} \
        -C ${CHANNEL_NAME} \
				-n ${CC_NAME} \
				-l ${CC_RUNTIME_LANGUAGE} \
				-v ${CC_VERSION} \
				-P \"OR ('n2mMSP.member', 'pnuMSP.member')\" \
        -c '{\"Args\":[\"CMT\",\"CityhubToken\",\"1000000000\"]}'"
}

function invokeChaincode() {
  parsePeerConnectionParameters ${orgs[0]} ${orgs[1]}

  setGlobals $1
  docker exec -i -t \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    cli_n2m /bin/bash \
      -c "peer chaincode invoke \
        -o orderer0.cityhub.org:7050 \
        --tls --cafile $ORDERER_CA \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        $PEER_CONN_PARMS \
        -c '{\"Args\":[\"transfer\", \"n2mMSP\", \"admin\", \"n2mMSP\", \"$2\", \"1\"]}'"
}

function queryChaincode() {
  parsePeerConnectionParameters ${orgs[0]} ${orgs[1]}

  setGlobals $1
  docker exec -i -t \
    -e CORE_PEER_TLS_ENABLED=$TLS_ENABLED \
    -e CORE_PEER_TLS_CERT_FILE=$TLS_CERT_FILE \
    -e CORE_PEER_TLS_KEY_FILE=$TLS_KEY_FILE \
    -e CORE_PEER_LOCALMSPID=$LOCALMSPID \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$TLS_ROOTCERT_FILE \
    -e CORE_PEER_MSPCONFIGPATH=$MSPCONFIGPATH \
    -e CORE_PEER_ADDRESS=$ADDRESS \
    cli_n2m /bin/bash \
      -c "peer chaincode invoke \
        -o orderer0.cityhub.org:7050 \
        --tls --cafile $ORDERER_CA \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        $PEER_CONN_PARMS \
        -c '{\"Args\":[\"balanceOf\", \"n2mMSP\", \"$2\"]}'"
}


function parsePeerConnectionParameters() {
  PEER_CONN_PARMS=""
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1
    PEER="peer0.${ORG}"
    PEERS="$PEERS $PEER"
    PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses $ADDRESS"
    TLSINFO=$(eval echo "--tlsRootCertFiles \$TLS_ROOTCERT_FILE")
    PEER_CONN_PARMS="$PEER_CONN_PARMS $TLSINFO"
    shift
  done
  echo $PEERS
  PEERS="$(echo -e "$PEERS" | sed -e 's/^[[:space:]]*//')"
  echo $PEERS
}

function deployCC() {
	if [ ${CC_RUNTIME_LANGUAGE} == "node" ]; then
  docker exec -i -t \
    cli_n2m /bin/bash \
			-c "pushd ${CLI_CHAINCODE_PATH} && npm install && popd"
	else
  setupChaincode
	fi

  packageChaincode ${orgs[0]}

  for ((i=0;i<${#orgs[@]}-1;i++))
  do
    installPackageChaincode ${orgs[i]}
  done

	instantiateChaincode ${orgs[0]}
}

function createCaDocker() {
  COMPOSE_FILES="-f ${COMPOSE_FILE_CA}"

	export N2M_CA_PRIVATE_KEY=$(cd build/channel-artifacts/crypto-config/peerOrganizations/n2m.cityhub.org/ca && ls *_sk)
	export PNU_CA_PRIVATE_KEY=$(cd build/channel-artifacts/crypto-config/peerOrganizations/pnu.cityhub.org/ca && ls *_sk)

	export N2M_TLSCA_PRIVATE_KEY=$(cd build/channel-artifacts/crypto-config/peerOrganizations/n2m.cityhub.org/tlsca && ls *_sk)
	export PNU_TLSCA_PRIVATE_KEY=$(cd build/channel-artifacts/crypto-config/peerOrganizations/pnu.cityhub.org/tlsca && ls *_sk)

	SYS_CHANNEL=$SYS_CHANNEL IMAGE_TAG=$IMAGETAG docker-compose $COMPOSE_FILES up -d 2>&1
}

function networkDown() {
  for ((i=0;i<${#orgs[@]}-1;i++))
  do
    rm -rf ${PWD}/config/ca/${orgs[i]}/msp
    rm -rf ${PWD}/config/ca/${orgs[i]}/fabric-ca-server.db
    rm -rf ${PWD}/config/ca/${orgs[i]}/Issuer*
    rm -rf ${PWD}/config/ca/${orgs[i]}/ca-cert.pem

    rm -rf ${PWD}/config/tlsca/${orgs[i]}/msp
    rm -rf ${PWD}/config/tlsca/${orgs[i]}/fabric-ca-server.db
    rm -rf ${PWD}/config/tlsca/${orgs[i]}/Issuer*
    rm -rf ${PWD}/config/tlsca/${orgs[i]}/ca-cert.pem
  done

	docker-compose -f $COMPOSE_FILE_BASE -f $COMPOSE_FILE_CA down --volumes --remove-orphans
  docker stop $(docker ps -a -q)
  docker rm $(docker ps -a -q)
  docker rmi $(docker images dev-* -q)
  docker volume prune --force
  docker network prune --force

  if [ -d $BDIR ]; then
    rm -rf $BDIR
  fi
}

function networkSetup() {
  networkDown
  sleep 3

  networkUp
  sleep 3

  makeChannel
  sleep 3

  deployCC
  sleep 3
  
  invokeChaincode ${orgs[0]} ${users[0]}
  sleep 2

  queryChaincode ${orgs[0]} ${users[0]}
  sleep 2

  createCaDocker
  sleep 3
}

if [ $# -lt 1 ]; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

if [ $# -ge 1 ] ; then
  key="$1"
  if [ "$key" == "createChannel" ]; then
      export MODE="createChannel"
      shift
  fi
fi

while [ $# -ge 1 ]; do
  key="$1"
  case $key in
  -h )
    printHelp
    exit 0
    ;;
  -c )
    CHANNEL_NAME="$2"
    shift
    ;;
  -ca )
    CRYPTO="CA"
    shift
    ;;
  -ccn )
    CC_NAME="$2"
    shift
    ;;
  -ccp )
    CC_SRC_PATH="$2"
    shift
    ;;
  -ccl )
    CC_SRC_LANGUAGE="$2"
    shift
    ;;
  -u )
    USER="$2"
    shift
    ;;
  * )
    echo "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done

if [ "$MODE" == "down" ]; then
  echo "Stopping network"
elif [ "$MODE" == "up" ]; then
  echo "Starting network"
elif [ "$MODE" == "createChannel" ]; then
  echo "Creating channel '${CHANNEL_NAME}'."
elif [ "$MODE" == "joinChannel" ]; then
  echo "Joining channel '${CHANNEL_NAME}'."
elif [ "$MODE" == "joinChannelForUser" ]; then
  echo "Joining channel '${CHANNEL_NAME}' For User."
elif [ "$MODE" == "deployCC" ]; then
  echo "Deploy Chaincode"
elif [ "$MODE" == "deployCCForUser" ]; then
  echo "Deploy Chaincode For User"
elif [ "$MODE" == "invokeChaincode" ]; then
  echo "invokeChaincode"
elif [ "$MODE" == "createCaDocker" ]; then
  echo "createCaDocker"
elif [ "$MODE" == "networkSetup" ]; then
  echo "networkSetup"
else
  printHelp
  exit 1
fi

if [ "$MODE" == "down" ]; then
  networkDown
elif [ "$MODE" == "up" ]; then
  networkUp
elif [ "$MODE" == "createChannel" ]; then
  makeChannel
elif [ "$MODE" == "joinChannel" ]; then
  joinChannel
elif [ "$MODE" == "joinChannelForUser" ]; then
  joinChannelForUser
elif [ "$MODE" == "deployCC" ]; then
  deployCC
elif [ "$MODE" == "deployCCForUser" ]; then
  deployCCForUser
elif [ "$MODE" == "invokeChaincode" ]; then
  invokeInitChaincode
elif [ "$MODE" == "createCaDocker" ]; then
  createCaDocker
elif [ "$MODE" == "networkSetup" ]; then
  networkSetup
else
  printHelp
  exit 1
fi
