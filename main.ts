
import { Server } from './server/server'


import { archivesRouter } from './archives/archives.router'
import { notifierRouter } from './notifiers/notifiers.router'
import { mainRouter } from './main.router'
import {sheetarchivesRouter} from './sheetarchives/sheetarchives.router'
import { environment } from './common/environment'


const server = new Server()
server.bootstrap([
  archivesRouter,       
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
