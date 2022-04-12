import express from 'express';
import { Application } from 'express';
import path from 'path';
import * as bodyParser from 'body-parser';
import http from 'http';
import https from 'https';
import os from 'os';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import mongoose from 'mongoose';
import cors from 'cors';

import installValidator from './swagger';

import l from './logger';

const app = express();
const privateKey = fs.readFileSync(path.join(__dirname, '../config/localhost.key'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, '../config/localhost.cert'), 'utf8');

const MONGO_URI = 'mongodb://127.0.0.1/enitt';

export default class ExpressServer {
  constructor() {
    const root = path.normalize(__dirname + '/../..');
    app.set('appPath', root + 'client');
    app.use(cors());
    app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || '50mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: process.env.REQUEST_LIMIT || '50mb' }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(express.static(`${root}/public`));
  }

  router(routes: (app: Application) => void): ExpressServer {
    installValidator(app, routes)
    return this;
  }

  listen(p: string | number = process.env.PORT): Application {
    const welcome = port => () => l.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${port}}`);
    const credentials = { key: privateKey, cert }
    http.createServer(app).listen(p, welcome(p));
    https.createServer(credentials, app).listen('43100', welcome('43100'));
    
    return app;
  }
}
