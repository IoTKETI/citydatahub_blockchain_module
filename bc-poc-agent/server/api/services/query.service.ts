import * as helper from '../../common/helper';
import { Peer, ChaincodeQueryRequest } from 'fabric-client';
import logger from '../../common/logger';
import { stringify } from 'querystring';

export interface Request {
  userName?: any; 2
  orgName?: any;
  bToken?: any;
}


export class QueryService {

  constructor() {
  }


  async queryChaincode(
    peer: string, channelName: string, chaincodeName: string,
    args: string[], fcn: string, username: string, org: string): Promise<string> {

    const channel = helper.getChannelForOrg(org);
    const client = helper.getClientForOrg(org);
    const target = this.buildTarget(peer, org);
    const user = await helper.getRegisteredUsers(username, org);
    const request: ChaincodeQueryRequest = {
      chaincodeId: chaincodeName,
      fcn,
      args
    };

    
    try {
      
      if (target) {
        request.targets = [target];
      }
  
      let result: string;

      const responsePayloads = await channel.queryByChaincode(request);
      if (responsePayloads) {
        responsePayloads.forEach((rp: Buffer) => {
          result = rp.toString('utf8');
          logger.info('Query Argument : ' + args[0] + ', value : ' + result);
        });
        return result;
      } else {
        logger.error('response_payloads is null');
        return 'response_payloads is null';
      }
    } catch (err) {
      logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
        err);
      return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
    }
  }

  buildTarget(peer: string, org: string): Peer {
    let target: Peer = null;
    if (typeof peer !== 'undefined') {
      const targets: Peer[] = helper.newPeers([peer], org);
      if (targets && targets.length > 0) {
        target = targets[0];
      }
    }
    return target;
  }
}

export default new QueryService();