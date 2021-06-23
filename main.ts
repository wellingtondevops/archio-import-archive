
import { Server } from './server/server'

import { volumesRouter } from './volumes/volumes.router'
import { archivesRouter } from './archives/archives.rouber'
import { notifierRouter } from './notifiers/notifiers.router'
import { mainRouter } from './main.router'
import {sheetarchivesRouter} from './sheetarchives/sheetarchives.router'
import { environment } from './common/environment'


const server = new Server()
server.bootstrap([
  archivesRouter,
  volumesRouter,        
  sheetarchivesRouter, 
  notifierRouter,
  mainRouter

]).then(server => {
  
  console.log(`Sever started 🦻 Port:${environment.server.port}`);
}).catch(error => {
  console.log('👻 Server failed to start 👻')
  console.error(error)
  process.exit(1)
})
