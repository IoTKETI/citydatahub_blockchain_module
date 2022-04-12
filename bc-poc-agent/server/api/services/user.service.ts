import log4js = require('log4js');
const logger = log4js.getLogger('SampleWebApp');
import { getErrorMessage } from '../../common/utils';
import * as helper from '../../common/helper';
import Client = require('fabric-client');
import * as jwt from 'jsonwebtoken';

export class UsersService {
    async all() {
        return;
    }

    async byId(id: number) {
        return this.all().then(r => r[id])
    }

    async registerUser(userName: string, userOrg: string): Promise<Client.User> {
        if (!userName) {
            getErrorMessage('\'userName\'');
            return;
        }
        if (!userOrg) {
            getErrorMessage('\'userOrg\'');
            return;
        }
        const token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + parseInt(
                Client.getConfigSetting('jwt_expiretime'), 10),
            userName,
            userOrg
        }, process.env.SESSION_SECRET);

        const response = await helper.getRegisteredUsers(userName, userOrg);

        if (response && typeof response !== 'string') {
            logger.debug('user register success')
            return response;

        } else {
            logger.debug('user register fail')
            return response;
        }
    }
}

export default new UsersService();