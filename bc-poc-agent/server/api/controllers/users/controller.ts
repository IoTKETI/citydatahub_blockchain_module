import { Request, Response } from 'express';
import UserService from '../../services/user.service';
import l from '../../../common/logger';
import authorizationService from '../../services/authorization.service';
import mongoose from 'mongoose';
import { DBService } from '../../services/db.service';

export interface User extends mongoose.Document {
  userId: string;
  userPw: string;
  userName: string;
  userEmail: string;
  userNickName: string;
  userTel: string;
}

const schema = new mongoose.Schema({
  userId: { type: String, required: true },
  userPw: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userNickName: { type: String, required: true },
  userTel: { type: String, required: true }
});

export const UserModel = mongoose.model<User>('User', schema);

export class Controller {
  all(req: Request, res: Response) {
    res.send('Will be implemented...').status(200).end();
  }

  getUserInfoById(req: Request, res: Response): void {
    const id = Number.parseInt(req.params['id'])
    UserService.byId(id).then(r => {
      if (r) res.json(r);
      else res.status(404).end();
    });
  }

  async login(req: Request, res: Response) {
    res.send('login..').status(200).end();
  }

  async join(req: Request, res: Response) {
    let user = new UserModel({
      userId: req.body.userId,
      userPw: req.body.userPw,
      userName: req.body.userName,
      userEmail: req.body.userEmail,
      userNickName: req.body.userNickName,
      userTel: req.body.userTel
    });

    user.save();

    res.send('{"test":"test"}').status(200).end();
  }

  async register(req: Request, res: Response) {
    const decoded = authorizationService.verify(req);

    l.info('============ Registrar Information ============');
    l.info('type : ' + decoded.type);
    l.info('type : ' + decoded.aud);
    l.info('userId : ' + decoded.userId);
    l.info('userOrg : ' + req.body.userOrg);
    l.info('userRole : ' + decoded.role);
    l.info('===============================================');

    await UserService.registerUser(decoded.userId, req.body.userOrg);
    res.send(decoded.userId + ' registered successfully');
  }
}
export default new Controller();
