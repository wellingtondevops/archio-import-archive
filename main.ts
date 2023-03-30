
import { Server } from './server/server'



import { consumer} from './queues/consumer'

import { notifierRouter } from './notifiers/notifiers.router'
import { mainRouter } from './main.router'
import {sheetarchivesRouter} from './sheetarchives/sheetarchives.router'
import { environment } from './common/environment'


const server = new Server()
server.bootstrap([
       
  sheetarchivesRouter, 
  notifierRouter,
  mainRouter,
  consumer

]).then(server => {
  
  console.log(`Sever started 🦻 Port:${environment.server.port}`);
}).catch(error => {
  console.log('👻 Server failed to start 👻')
  console.error(error)
  process.exit(1)
})
