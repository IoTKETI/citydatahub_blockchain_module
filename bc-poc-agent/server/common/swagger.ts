import path from 'path';
import middleware from 'swagger-express-middleware';
import { Application } from 'express';
import errorHandler from '../api/middlewares/error.handler';

export default function (app: Application, routes: (app: Application) => void) {
  middleware(path.join(__dirname, 'api.yml'), app, function(err, middleware) {

    app.enable('case sensitive routing');
    app.enable('strict routing');

    app.use(middleware.metadata());
    app.use(middleware.files(app, {
      apiPath: process.env.SWAGGER_API_SPEC,
    }));

    app.use(middleware.parseRequest({
      cookie: {
        secret: process.env.SESSION_SECRET
      },
      json: {
        limit: process.env.REQUEST_LIMIT
      }
    }));

    app.use(
      middleware.CORS(),
      middleware.validateRequest());

    routes(app);

    app.use(errorHandler);
  });
}
