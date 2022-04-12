import { Request, Response } from 'express';
import QureyService from '../../services/query.service';
import InvokeService from '../../services/invoke.service';
import l from '../../../common/logger';
import authorizationService from '../../services/authorization.service';

export class ReturnValues {
  constructor(public readonly result: string) {}
}

export class Controller {

  static chaincodeName: string = 'token';
  static channelName: string = 'marketplace-channel';
  static peerNames: string[] = ['peer0'];
  static org:string='n2m'; 
  static username: string = 'jouk';

  async putIncentiveWithHistory(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const fromUserMspId: string = 'n2mMSP';
    const toUserMspId: string = 'n2mMSP';
    const additional: string = req.body.additional.replace('\\','');
    const args: string[] = [fromUserMspId, req.body.fromId, toUserMspId, req.body.toId, req.body.amount, additional];
    const fcn: string = 'invokeTransferWithHistory';

    try {
      const result = await InvokeService.invokeChaincode(Controller.peerNames, Controller.channelName, Controller.chaincodeName, fcn, args, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);

      res.send(serialized).status(200).end();
    } catch (err) {
      l.info('Invoke IncentiveLogging process failed');
      res.status(404).end();
    }
  }


  
  async getIncentiveHistoryByUser(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);

    const userId: string = req.body.userId;
    const termStart: string = req.body.termStart == null ? "*" : req.body.termStart;
    const termEnd: string = req.body.termEnd == null ? "*" : req.body.termEnd;

    const fcn: string = 'queryIncentiveHistoryByUser';
    const args: string[] = [userId, termStart, termEnd];    

    try {          
      const result = await QureyService.queryChaincode(Controller.peerNames[0], Controller.channelName, Controller.chaincodeName, args, fcn, Controller.username, Controller.org);      
      res.send(`{"result" : ` + result + `}`).status(200).end();
    } catch (err) {
      l.info('Query incentive history by user failed');
      res.status(404).end();
    }

  }

  async getIncentiveAllHistory(req: Request, res: Response) {

    const decoded = authorizationService.verify(req);
    const fcn: string = 'queryIncentiveAllHistory';
    const args: string[] = [];

    try {
      const result = await QureyService.queryChaincode(Controller.peerNames[0], Controller.channelName, Controller.chaincodeName, args, fcn, Controller.username, Controller.org);
      res.send(`{"result" : ` + result + `}`).status(200).end();
    } catch (err) {
      l.info('Query Incentive all history failed');
      res.status(404).end();
    }

  }
}
export default new Controller();
