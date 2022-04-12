#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${MSPORG}/$2/" \
        -e "s/\${P0PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ./ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${MSPORG}/$2/" \
        -e "s/\${P0PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ./ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=n2m
MSPORG=n2m
P0PORT=7051
CAPORT=7054
PEERPEM=${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations/n2m.cityhub.org/tlsca/tlsca.n2m.cityhub.org-cert.pem
CAPEM=${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations/n2m.cityhub.org/ca/ca.n2m.cityhub.org-cert.pem

echo "$(json_ccp $ORG $MSPORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations/n2m.cityhub.org/connection-n2m.json
echo "$(yaml_ccp $ORG $MSPORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations/n2m.cityhub.org/connection-n2m.yaml

ORG=pnu
MSPORG=pnu
P0PORT=9051
CAPORT=8054
PEERPEM=${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations/pnu.cityhub.org/tlsca/tlsca.pnu.cityhub.org-cert.pem
CAPEM=${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations/pnu.cityhub.org/ca/ca.pnu.cityhub.org-cert.pem

echo "$(json_ccp $ORG $MSPORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations/pnu.cityhub.org/connection-pnu.json
echo "$(yaml_ccp $ORG $MSPORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > ${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations/pnu.cityhub.org/connection-pnu.yaml
