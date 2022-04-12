import * as helper from '../../common/helper';
import { ChannelEventHub, ProposalResponse, ChaincodeInvokeRequest } from 'fabric-client';
import logger from '../../common/logger';
import * as util from 'util';



export class InvokeService {

    constructor() { }

    async adminChaincode(
        peerNames: string[], channelName: string,
        chaincodeName: string, fcn: string, args: string[], userName: string, org: string): Promise<string> {

        logger.debug(
            util.format('\n============ invoke admin transaction on organization %s ============\n', org));

        const client = helper.getClientForOrg(org);
        const channel = helper.getChannelForOrg(org);
        const targets = (peerNames) ? helper.newPeers(peerNames, org) : undefined;
        const admin = await helper.getOrgAdmin(org)
        const txId = client.newTransactionID();
        logger.debug(util.format('Sending transaction "%j"', txId));
        const request: ChaincodeInvokeRequest = {
            chaincodeId: chaincodeName,
            fcn,
            args,
            txId
        };

        try {

            if (targets) {
                request.targets = targets;
            }

            const results = await channel.sendTransactionProposal(request);
            const proposalResponses = results[0];
            const proposal = results[1];
            let allGood = true;

            proposalResponses.forEach((pr: ProposalResponse) => {
                let oneGood = false;
                if (pr.response && pr.response.status === 200) {
                    oneGood = true;
                    logger.info('transaction proposal was good');
                } else {
                    logger.error('transaction proposal was bad');
                }
                allGood = allGood && oneGood;
            });

            if (allGood) {
                const responses = proposalResponses as ProposalResponse[];
                const proposalResponse = responses[0];
                const request2 = {
                    proposalResponses: responses,
                    proposal
                };
                const transactionID = txId.getTransactionID();
                const eventPromises: Array<Promise<any>> = [];

                if (!peerNames) {
                    peerNames = channel.getPeers().map((peer) => {
                        return peer.getName();
                    });
                }

                const eventhubs = helper.newEventHubs(peerNames, org);

                eventhubs.forEach((eh: ChannelEventHub) => {
                    eh.connect();

                    const txPromise = new Promise((resolve, reject) => {
                        const handle = setTimeout(() => {
                            eh.disconnect();
                            reject();
                        }, 30000);

                        eh.registerTxEvent(transactionID, (tx: string, code: string) => {
                            clearTimeout(handle);
                            eh.unregisterTxEvent(transactionID);
                            eh.disconnect();

                            if (code !== 'VALID') {
                                logger.error(
                                    'The balance transfer transaction was invalid, code = ' + code);
                                reject();
                            } else {
                                resolve();
                            }
                        });
                    });
                    eventPromises.push(txPromise);
                });

                const sendPromise = channel.sendTransaction(request2);
                const results2 = await Promise.all([sendPromise].concat(eventPromises));

                logger.debug(' event promise all complete and testing complete');
                
                if (results2[0].status === 'SUCCESS') {
                    return txId.getTransactionID();
                } else {
                    logger.error('Failed to order the transaction. Error code: ' + results2[0].status);
                    return 'Failed to order the transaction. Error code: ' + results2[0].status;
                }
            } else {
                logger.error(
                    'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
                );
                return 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...';
            }

        } catch (err) {
            logger.error('Failed to send transaction due to error: ' + err.stack ? err
                .stack : err);
            return 'Failed to send transaction due to error: ' + err.stack ? err.stack :
                err;
        }
    }




    async invokeChaincode(
        peerNames: string[], channelName: string,
        chaincodeName: string, fcn: string, args: string[], userName: string, org: string): Promise<string> {
        const admin = await helper.getOrgAdmin(org);
       
        const client = helper.getClientForOrg(org);
        const channel = helper.getChannelForOrg(org);
        const targets = (peerNames) ? helper.newPeers(peerNames, org) : undefined;
       
        const txId = client.newTransactionID();
        const request: ChaincodeInvokeRequest = {
            chaincodeId: chaincodeName,
            fcn,
            args,
            txId
        };

        try {
            
            if (targets) {
                request.targets = targets;
            }

            const results = await channel.sendTransactionProposal(request);
            const proposalResponses = results[0];
            const proposal = results[1];
            let allGood = true;

            proposalResponses.forEach((pr: ProposalResponse) => {
                let oneGood = false;
                if (pr.response && pr.response.status === 200) {
                    oneGood = true;
                    // logger.info('transaction proposal was good');
                } else {
                    logger.error('transaction proposal was bad');
                }
                allGood = allGood && oneGood;
            });

            if (allGood) {
                const responses = proposalResponses as ProposalResponse[];
                const proposalResponse = responses[0];
                const request2 = {
                    proposalResponses: responses,
                    proposal
                };

                const transactionID = txId.getTransactionID();
                const eventPromises: Array<Promise<any>> = [];

                if (!peerNames) {
                    peerNames = channel.getPeers().map((peer) => {
                        return peer.getName();
                    });
                }

                const eventhubs = helper.newEventHubs(peerNames, org);

                eventhubs.forEach((eh: ChannelEventHub) => {
                    eh.connect();

                    const txPromise = new Promise((resolve, reject) => {
                        const handle = setTimeout(() => {
                            eh.disconnect();
                            reject();
                        }, 30000);

                        eh.registerTxEvent(transactionID, (tx: string, code: string) => {
                            clearTimeout(handle);
                            eh.unregisterTxEvent(transactionID);
                            eh.disconnect();

                            if (code !== 'VALID') {
                                logger.error(
                                    'The balance transfer transaction was invalid, code = ' + code);
                                reject();
                            } else {
                                resolve();
                            }
                        });
                    });
                    eventPromises.push(txPromise);
                });

                const sendPromise = channel.sendTransaction(request2);
                const results2 = await Promise.all([sendPromise].concat(eventPromises));

                if (results2[0].status === 'SUCCESS') {
                    return proposalResponse.response.payload.toString();
                } else {
                    logger.error('Failed to order the transaction. Error code: ' + results2[0].status);
                    return 'Failed to order the transaction. Error code: ' + results2[0].status;
                }
            } else {
                logger.error(
                    'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
                );
                return 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...';
            }

        } catch (err) {
            logger.error('Failed to send transaction due to error: ' + err.stack ? err
                .stack : err);
            return 'Failed to send transaction due to error: ' + err.stack ? err.stack :
                err;
        }
    }
}

export default new InvokeService();