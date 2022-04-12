import { Request, Response } from 'express';
import QureyService from '../../services/query.service';
import InvokeService from '../../services/invoke.service';
import l from '../../../common/logger';
import authorizationService from '../../services/authorization.service';

export class Controller {
  static chaincodeName: string = 'token';
  static channelName: string = 'marketplace-channel';
  static peerNames: string[] = ['peer0'];
  static org:string='n2m';
  static username: string = 'jouk';

  addDevice(req: Request, res:Response) {
  }

  async putDevice(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    console.log(req)
    const args: string[] = [req.body.deviceId, req.body.deviceName, req.body.publicKey];
    const fcn: string = 'deviceRegister';

    try {
      const result = await InvokeService.invokeChaincode(Controller.peerNames, Controller.channelName, Controller.chaincodeName, fcn, args, Controller.username, Controller.org);
      console.log(1)
      console.log(result)
      res.send(result).status(200).end();
      
    } catch (err) {
      l.info('Invoke device register failed');
      res.status(404).end();
    }
  }

  async getDeviceById(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const deviceId: string = req.params['deviceId'];
    const fcn: string = 'deviceById';
    const args: string[] = [deviceId];

    try {
      const result = await QureyService.queryChaincode(Controller.peerNames[0], Controller.channelName, Controller.chaincodeName, args, fcn, Controller.username, Controller.org);
      res.send(result).status(200).end();
    } catch (err) {
      l.info('Query device information by deviceId failed');
      res.status(404).end();
    }

  }
}
export default new Controller();
