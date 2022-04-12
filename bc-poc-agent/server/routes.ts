import { Application } from 'express';
import networkRouter from './api/controllers/network/router'
import deviceRouter from './api/controllers/device_management/router'
import incentiveRouter from './api/controllers/incentive_log/router'
import tokenRouter from './api/controllers/token/router'
import usersRouter from './api/controllers/users/router'
export default function routes(app: Application): void {
  app.use('/network', networkRouter);
  app.use('/device', deviceRouter);
  app.use('/incentive', incentiveRouter);
  app.use('/token', tokenRouter);
  app.use('/users', usersRouter);
};