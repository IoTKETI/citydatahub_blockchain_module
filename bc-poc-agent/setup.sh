sudo rm -rf ${PWD}/server/config/crypto-config && mkdir ${PWD}/server/config/crypto-config
sudo rm -rf ${PWD}/server/config/wallet && mkdir ${PWD}/server/config/wallet
sudo cp -r ${PWD}/../build/channel-artifacts/crypto-config/peerOrganizations ${PWD}/server/config/crypto-config
sudo cp -r ${PWD}/../build/channel-artifacts/crypto-config/ordererOrganizations ${PWD}/server/config/crypto-config
sudo chmod -R 777 ${PWD}/server/config/crypto-config
cd ${PWD}/server/config/crypto-config && ls

npm run dev