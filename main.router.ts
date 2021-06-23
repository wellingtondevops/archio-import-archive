import { Router } from './common/router'
import * as restify from 'restify'


class MainRouter extends Router {
  applyRoutes(application: restify.Server) {
    application.get('/', (req, resp, next) => {
      resp.json({
        
        users: '/users',        
        archives: '/archives',
        notifiers:'/notifiers',
        version: '1.0.0'
      })
    })
  }
}

export const mainRouter = new MainRouter()
