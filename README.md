# 0. 실행환경

Centos 8

| 구분           | 버전    |
| -------------- | ------- |
| docker         | 20.10.7 |
| docker-compose | 1.29.2  |
| go             | 1.14.15  |
| node           | 14.17.0 |
| npm            | 6.14.14 |

# 1. 블록체인 기반 인센티브 플랫폼 SW

블록체인 기반 인센티브 플랫폼은 Data Hub의 서비스 활성화를 위한 서비스 제공자의 정책에 따라 인센티브를 토큰으로 지급 및 관리하는 소프트웨어


## 1.1 핵심 개념

1. 데이터 허브 서비스 활동 기반 블록체인 기반 인센티브 생성
2. 데이터 허브 서비스의 블록체인에 인증 정보 생성 및 저장
3. 토큰 인센티브 서비스 생성/조회/전송/관리 기능

<img alt="1.Overview" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/1_Blockchain_Based_Incentive_Platform_SW/1.Overview.png">

## 1.2 사양

1. Ethereum의 erc20 토큰 표준으로서의 스마트 계약
2. Hyperledger Fabric 표준을 사용한 컨소시엄 블록체인 아키텍처
3. RAFT 합의 알고리즘을 이용한 트랜잭션 구현

## 1.3 아키텍처
<img alt="3.Blockchain_Based_Incentive_Platform_Architecture" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/1_Blockchain_Based_Incentive_Platform_SW/3.Blockchain_Based_Incentive_Platform_Architecture.png">

1. API Controller : 유저 관리, 토큰 관리(토큰 발급, 전송 등), 인센티브 관리(허브 활동 인센티브 제공, 인센티브 총액 확인 등) 요청 관리 모듈
2. Service : JWT 관리, 블록체인 Function 관리, DB 관리 모듈
3. Common : Fabric SDK, logger 등의 기능 제공
4. Blockchain : 하이퍼레저 패브릭 블록체인 네트워크 (erc20 체인코드 구축)

* API Gateway와 블록체인 연동
  1. Data Hub 요청 (인센티브 제공, 인센티브 총액확인, 인센티브 히스토리 확인) - AuthHeader + Body
  2. User 확인 요청
  3. Wallet Public-key 로드
  4. User JWT 확인
  5,6. Chaincode 호출
  6. Common fabric SDK를 통해 하이퍼레저 패브릭 블록체인 체인코드 호출
  7. 체인코드 수행 후, 응답 완료

## 1.4 기존 시스템과의 차이점
<img alt="2. Point_Of_Difference" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/1_Blockchain_Based_Incentive_Platform_SW/2.Point_Of_Difference.png">

# 2.1 Prerequisites

**하이퍼레저 패브릭 네트워크를 구축하기 위해 필요한 도커, Golang 설치과정을 설명합니다.**

## 2.1.1 Docker 이전 버전 삭제하기

```bash
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```
  
<img alt="1. Remove_Preversion_Docker" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/2_Install/2.1_Prerequisites/1.Remove_Preversion_Docker.png">

## 2.1.2 Script를 이용한 도커 설치

### curl 설치

```bash
sudo yum install curl
sudo yum install curl-devel
```  
<img alt="2. Install_Curl" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/2_Install/2.1_Prerequisites/2.Install_Curl.png">

### script를 이용한 도커 설치

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```
<img alt="3. Install_Docker_Script" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/2_Install/2.1_Prerequisites/3.Install_Docker_Script.png">



## 2.1.3 go 설치하기

### Download
```bash
cd /usr/local/src
sudo curl -O https://dl.google.com/go/go1.14.linux-amd64.tar.gz
```

### 압축풀기
```bash
sudo tar -C /usr/local -xzf go1.14.linux-amd64.tar.gz
```

### go 환경번수 설정하기
```bash
vi ~/.bash_profile
```
  
> export GOPATH=\$HOME/go  
> 
> export PATH=\$PATH:\$GOPATH/bin  
> 
> export PATH=\$PATH:/usr/local/go/bin  


```bash
source ~/.bash_profile
```

### go 버전 확인하기
```bash
go version
```
<img alt="4. Go_Version" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/2_Install/2.1_Prerequisites/4.Go_Version.png">

# 2.2 필요한 패키지 설치

**하이퍼레저 패브릭 네트워크에 사용되는 Token 체인코드를 사용하기 위한 패키지 설치과정을 설명합니다.**

## 2.2.1 블록체인 소스코드 다운로드

```bash
mkdir ${GOPATH}/src/github.com
cd ${GOPATH}/src/github.com
git clone https://github.com/IoTKETI/citydatahub_blockchain
```  
<img alt="1. Git_Clone_Blockchain" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/2_Install/2.2_Install Package For Chaincode/1.Git_Clone_Blockchain.png">


## 2.2.2 패키지 설치하기

### fabric 1.4 패키지

```bash
cd ${GOPATH}/src/github.com/citydatahub_blockchain/package
git clone -b release-1.4 https://github.com/hyperledger/fabric.git
```  

<img alt="2. Install_Fabric_Pakcage" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/2_Install/2.2_Install Package For Chaincode/2.Install_Fabric_Pakcage.png">

### vendor package

```bash
tar -zxvf vendor.tar.gz
```

# 3.1 블록체인 네트워크 빌드

**하이퍼레저 패브릭 네트워크 빌드하는 과정을 설명합니다.**

## 3.1.1 블록체인 네트워크 빌드

```bash
cd $GOPATH/src/github.com/citydatahub_blockchain
sudo ./mynetwork.sh up
```  


<img alt="1. Build_Blockchain_Network_1" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/3_Build Blockchain Network/3.1_Setup_Blockchain_Network/1.Build_Blockchain_Network_1.png">
<img alt="1. Build_Blockchain_Network_2" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/3_Build Blockchain Network/3.1_Setup_Blockchain_Network/1.Build_Blockchain_Network_2.png">

# 3.2 블록체인 네트워크 채널 생성 및 참여 시키기

**하이퍼레저 패브릭 네트워크 채널 생성 과 참여시키는 과정을 설명합니다.**

## 3.2.1 블록체인 네트워크 채널 생성 및 참여

```bash
cd $GOPATH/src/github.com/citydatahub_blockchain
sudo ./mynetwork.sh creteChannel
```  

<img alt="1. Create_Channel" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/3_Build Blockchain Network/3.2_Join_Blockchain_Network/1.Create_Channel.png">

# 3.3 블록체인 네트워크에 체인코드 올리기

**하이퍼레저 패브릭 네트워크에 체인코드를 올리는 과정을 설명합니다.**

## 3.3.1 블록체인 네트워크에 체인코드 올리기

```bash
cd $GOPATH/src/github.com/citydatahub_blockchain
sudo ./mynetwork.sh deployCC
```  

<img alt="1. Deploy_Chaincode" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/3_Build Blockchain Network/3.3_Deploy_Chaicode_in_Blockchain_Network/1.Deploy_Chaincode.png">

# 3.4 블록체인 네트워크에 CA 올리기

**하이퍼레저 패브릭 네트워크에 CA를 올리는 과정을 설명합니다.**

## 3.4.1 블록체인 네트워크에 CA 올리기

```bash
cd $GOPATH/src/github.com/citydatahub_blockchain
sudo ./mynetwork.sh createCaDocker
```  

<img alt="1. Build_CA" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/3_Build Blockchain Network/3.4_Build_CA_in_Blockchain_Network/1.Build_CA.png">

# 3.5 한번에 네트워크 빌드하기

**하이퍼레저 패브릭 네트워크를 한번에 빌드하는 과정을 설명합니다.**

## 3.5.1 블록체인 네트워크 빌드

```bash
cd $GOPATH/src/github.com/citydatahub_blockchain
sudo ./mynetwork.sh networkSetup
```  

<img alt="1. One_Stop_Build_Blockchain_Network_1" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/3_Build Blockchain Network/3.5_One_Cammand_for_Blockchain_Network/1.One_Stop_Build_Blockchain_Network_1.png">
<img alt="1. One_Stop_Build_Blockchain_Network_2" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/3_Build Blockchain Network/3.5_One_Cammand_for_Blockchain_Network/1.One_Stop_Build_Blockchain_Network_2.png">
<img alt="1. One_Stop_Build_Blockchain_Network_3" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/3_Build Blockchain Network/3.5_One_Cammand_for_Blockchain_Network/1.One_Stop_Build_Blockchain_Network_3.png">

# 4.1 하이퍼레저 패브릭 credential 복사

**swagger API agent를 사용하기 위한 하이퍼레저 패브릭 credential을 복사하는 과정을 설명합니다.**

## 4.1.1 하이퍼레저 패브릭 credential 복사

```bash
cd $GOPATH/src/github.com/citydatahub_blockchain/bc-poc-agent
./setup.sh
```

완료가 되면 그림처럼 build된 orderer 조직과 peer 조직 credential을 복사함
```bash
PATH: $GOPATH/src/github.com/citydatahub_blockchain/bc-poc-agent/config/crypto-config
```

<img alt="1. Copy_Credential_In_Hyperledger_Fabric" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/4_swagger API Agent/4.1_Copy_Credential_in_Hyperledger_Fabric/1.Copy_Credential_In_Hyperledger_Fabric.png">

# 4.2 swagger 실행

**swagger API agent를 사용하기 위한 과정을 설명합니다.**

## 4.2.1 node library install

```bash
cd $GOPATH/src/github.com/citydatahub_blockchain/bc-poc-agent
npm install
```
<img alt="1. Install_Node_Libray" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/4_swagger API Agent/4.2_Execute_API_Agent_Swagger/1.Install_Node_Libray.png">


## 4.2.1 Execute API Agent (swagger)

```bash
cd $GOPATH/src/github.com/citydatahub_blockchain/bc-poc-agent
npm run dev
```
<img alt="2. Execute_API_Agent" src="https://github.com/IoTKETI/citydatahub_blockchain/blob/main/images/4_swagger API Agent/4.2_Execute_API_Agent_Swagger/2.Execute_API_Agent.png">
