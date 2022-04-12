import { Request, Response } from 'express';
import ChannelService from '../../services/channel.service';
import l from '../../../common/logger';
import authorizationService from '../../services/authorization.service';

export class Controller {

  static chaincodeName: string = 'token';
  static channelName: string = 'marketplace-channel';
  static peerNames: string[] = ['peer0'];
  static org: string = 'n2m';
  static username: string = 'jouk';

  async getBlockByNumber(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const blockNumber: string = req.params['number'];
    
    try {
      const result = await ChannelService.GetBlockByNumber(Controller.peerNames[0], blockNumber, Controller.username, Controller.org)
      res.send(result).status(200).end();
      
    } catch (err) {
      l.info('Query block by number failed');
      res.status(404).end();
    }
  }

  async getTransactionById(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const transactionId: string = req.params['id'];

    try {
      const result = await ChannelService.GetTransactionById(Controller.peerNames[0], transactionId, Controller.username, Controller.org)
      res.send(result).status(200).end();
    } catch (err) {
      l.info('Query transaction by transaction id failed');
      res.status(404).end();
    }

  }

  async getChainInfo(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);

    try {
      const result = await ChannelService.GetChainInfo(Controller.peerNames[0], Controller.username, Controller.org);
      res.send(result).status(200).end();
    } catch (err) {
      l.info('Query chain info failed');
      res.status(404).end();
    }

  }

  async getChannels(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);

    try {
      const result = await ChannelService.GetChannels(Controller.peerNames[0], Controller.username, Controller.org);
      res.send(result).status(200).end();
    } catch (err) {
      l.info('Query channels info failed');
      res.status(404).end();
    }

  }
}

export default new Controller();
