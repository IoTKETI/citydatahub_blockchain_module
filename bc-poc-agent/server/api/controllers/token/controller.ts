import { Request, Response } from 'express';
import QureyService from '../../services/query.service';
import InvokeService from '../../services/invoke.service';
import l from '../../../common/logger';
import authorizationService from '../../services/authorization.service';
import { mapHttpRequest } from 'pino-std-serializers';
import { resultInfoType } from '../../model/reponse'
import {GetCurrentTimestamp} from '../../../common/utils'

export class ReturnValues {
  constructor(public readonly result: string) {}
}

export class Controller {
  static chaincodeName: string = 'token';
  static channelName: string = 'marketplace-channel';
  static peerNames: string[] = ['peer0'];
  static org:string='n2m'; 
  static username: string = 'admin';


  async init(req: Request, res: Response) {
  }

  async generate(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const fcn: string = 'generate';    
    const args: string[] = [req.body.amount];

    try {
      const result = await InvokeService.invokeChaincode(Controller.peerNames, Controller.channelName, Controller.chaincodeName, fcn, args, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      const generateResponse: resultInfoType = {  
        data: serialized, 
        date: GetCurrentTimestamp()
      }
      const resultSerialized = JSON.stringify(generateResponse);
      res.send(resultSerialized).status(200).end();
    } catch (err) {
      l.info('invoke err');
      res.status(404).end();
    }
  }

  async totalSupply(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const fcn: string = 'totalSupply';
    const args: string[] = [];
    
    try {
      const result = await QureyService.queryChaincode(Controller.peerNames[0], Controller.channelName, Controller.chaincodeName, args, fcn, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      const generateResponse: resultInfoType = {  
        data: serialized,
        date: GetCurrentTimestamp()
      }
      const resultSerialized = JSON.stringify(generateResponse);
      res.send(resultSerialized).status(200).end();
    } catch (err) {
      l.info('Query failed');
      l.error(err);
      res.status(404).end();
    }
  }

  async name(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const fcn: string = 'name';
    const args: string[] = [];

    try {
      const result = await QureyService.queryChaincode(Controller.peerNames[0], Controller.channelName, Controller.chaincodeName, args, fcn, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      const generateResponse: resultInfoType = {  
        data: serialized,
        date: GetCurrentTimestamp()
      }
      const resultSerialized = JSON.stringify(generateResponse);
      res.send(resultSerialized).status(200).end();
    } catch (err) {
      l.info('Query failed');
      res.status(404).end();
    }
  }  

  async availableBalanceOf(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const userMSP: string = 'n2mMSP';
    const userId: string = req.params['femsId'];
    const fcn: string = 'availableBalanceOf';
    const args: string[] = [userMSP, userId];

    try {
      console.log(args);
      const result = await QureyService.queryChaincode(Controller.peerNames[0], Controller.channelName, Controller.chaincodeName, args, fcn, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      res.send(serialized).status(200).end();
    } catch (err) {
      l.info('Query failed');
      res.status(404).end();
    }

  }

  async balanceOf(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const userMSP: string = 'n2mMSP';
    const userId: string = req.params['userId'];
    const fcn: string = 'balanceOf';
    const args: string[] = [userMSP, userId];
    console.log(args)

    try {
      console.log(args);
      const result = await QureyService.queryChaincode(Controller.peerNames[0], Controller.channelName, Controller.chaincodeName, args, fcn, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      const generateResponse: resultInfoType = {  
        data: serialized,
        date: GetCurrentTimestamp()
      }
      const resultSerialized = JSON.stringify(generateResponse);
      res.send(resultSerialized).status(200).end();
    } catch (err) {
      l.info('Query failed');
      res.status(404).end();
    }

  }

  async transfer(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const fromUserMspId: string = 'n2mMSP';
    const toUserMspId: string = 'n2mMSP';
    const args: string[] = [fromUserMspId, req.body.fromUserId, toUserMspId, req.body.toUserId, req.body.amount];
    const fcn: string = 'transfer';

    try {
      const result = await InvokeService.invokeChaincode(Controller.peerNames, Controller.channelName, Controller.chaincodeName, fcn, args, Controller.username, Controller.org);
      console.log(result)
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      const generateResponse: resultInfoType = {  
        data: serialized,
        date: GetCurrentTimestamp()
      }
      const resultSerialized = JSON.stringify(generateResponse);
      res.send(resultSerialized).status(200).end();
    } catch (err) {
      l.info('invoke err');
      res.status(404).end();
    }
  }

  async approve(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const fromUserMspId: string = 'n2mMSP';
    const toUserMspId: string = 'n2mMSP';
    const args: string[] = [fromUserMspId, req.body.ownerId, toUserMspId, req.body.spenderId, req.body.amount];
    console.log(req.body)
    const fcn: string = 'approve';
    
    try {
      const result = await InvokeService.invokeChaincode(Controller.peerNames, Controller.channelName, Controller.chaincodeName, fcn, args, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      const generateResponse: resultInfoType = {  
        data: serialized,
        date: GetCurrentTimestamp()
      }
      const resultSerialized = JSON.stringify(generateResponse);
      res.send(resultSerialized).status(200).end();
    } catch (err) {
      l.info('invoke failed');
      res.status(404).end();
    }

  }

  async allowance(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const args: string[] = ['n2mMSP', req.body.ownerId, 'n2mMSP', req.body.spenderId];
    const fcn: string = 'allowance';
    try {
      const result = await QureyService.queryChaincode(Controller.peerNames[0], Controller.channelName, Controller.chaincodeName, args, fcn, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      const generateResponse: resultInfoType = {  
        data: serialized,
        date: GetCurrentTimestamp()
      }
      const resultSerialized = JSON.stringify(generateResponse);
      res.send(resultSerialized).status(200).end();
    } catch (err) {
      l.info('Query failed');
      res.status(404).end();
    }
  }

  async transferFrom(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);
    const args: string[] = ['n2mMSP', req.body.invokerId, 'n2mMSP', req.body.fromUserId, 'n2mMSP', req.body.toUserId, req.body.amount];
    const fcn: string = 'transferFrom';

    try {      
      const result = await InvokeService.invokeChaincode(Controller.peerNames, Controller.channelName, Controller.chaincodeName, fcn, args, Controller.username, Controller.org);
      const val = new ReturnValues(result);
      const serialized = JSON.stringify(val);
      const generateResponse: resultInfoType = {  
        data: serialized,
        date: GetCurrentTimestamp()
      }
      const resultSerialized = JSON.stringify(generateResponse);
      res.send(resultSerialized).status(200).end();
    } catch (err) {
      l.info('invoke failed');
      res.status(404).end();
    }
  }

  async performanceTest(req: Request, res: Response) {

    const decoded = authorizationService.verify(req);
    const testNumber: number = 150;
    const userMSP: string = 'n2mMSP';
    const userId: string = 'admin';
    const chaincodeName: string = 'token';
    const channelName: string = 'marketplace-channel';
    const args: string[] = [userMSP, userId];
    var args2d: string[][] = [['n2mMSP', req.body.fromFemsId, 'n2mMSP', req.body.toFemsId, req.body.amount]];
    const fcn: string = 'transfer';
    const fcnQuery: string = 'balanceOf'; 
    const userName: string = req.body.fromId;
    const org:string='n2m';
    const peerNames: string[] = ['peer0'];
    const peer: string = 'peer0';
    const username: string = 'admin_registrar';
    let arrNumber = new Array();

    for (let i = 0; i < testNumber; i++) {
      arrNumber[i] = i;
      args2d[i] = ['n2mMSP', i.toString(), 'n2mMSP', (testNumber + i).toString(), '0']
    }

    var start = +new Date(); 
    console.log('\n =========================== start : ' + start + '=========================== ');

    const promises = arrNumber.map(item =>
      InvokeService.invokeChaincode(peerNames, channelName, chaincodeName, fcn, args2d[item], userName, org)
    );

    await Promise.all(promises);

    var end = +new Date();
    var diff = end - start;
    console.log('\n =========================== Transaction Count : ' + testNumber);
    console.log(' =========================== Time : ' + diff + ' millisecond');
    console.log(' =========================== TPS : ' + (testNumber) / (diff / 1000));
    res.send('TPS : ' + (testNumber*2) / (diff / 1000)).status(200).end();

  }
}

export default new Controller();
