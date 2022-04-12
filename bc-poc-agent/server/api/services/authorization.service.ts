import * as jwt from 'jsonwebtoken';
import l from '../../common/logger';
import requestSync from 'sync-request';
import * as path from 'path';
import * as fs from 'fs';
import { Request } from 'express';

export class AuthorizationService {
    verify(req: Request):any {

        const token = req.headers.authorization.split(' ')[1];
        const verifyOption = {
            algorithm: "RS256"
        }
        const publicKey = fs.readFileSync(path.join(__dirname, '../../config/aas-public-key.pem'));

        return jwt.verify(token, publicKey, verifyOption); 
    }

}

export default new AuthorizationService();