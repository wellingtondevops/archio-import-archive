import * as mongoose from "mongoose";
import * as moment from 'moment'
import * as restify from "restify";
import { ModelRouter } from "../common/model-router";
import { MethodNotAllowedError, InvalidCredentialsError } from "restify-errors";
import { mergePatchBodyParser } from "../server/merge-patch.parser";
import 'moment/locale/pt-br';
import xl = require('excel4node')
var XLSX = require('xlsx')
const bufferFrom = require('buffer-from')

import { authenticate } from '../security/auth.handler';
import { authorize } from "../security/authz.handler";
import { Archive } from "../archives/archives.model";
import { Volume } from "../volumes/volumes.model";
import { Company } from "../companies/companies.model";
import { User } from "../users/users.model";
import { Doct } from '../docts/docts.model';
import { Sheetarchive } from '../sheetarchives/sheetarchives.model'
import { Position } from '../positions/positions.model'
import { Storehouse } from '../storehouses/storehouses.model'
import { Profile } from "../profiles/profiles.model";
import { Sheetvolume } from "../sheetvolumes/sheetvolumes.model";
import { createVolumeMapTrue } from "../utils/archivesfunctions"


class ArchivesRouter extends ModelRouter<Archive> {
  constructor() {
    super(Archive);
  }


   import = async (req, resp, next) => {


    if (req.files.uploaded_file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      return next(new MethodNotAllowedError(`SOMENTE SÃO PERMITIDOS ARQUIVOS XLSX!`))
    }



    const { company, departament, storehouse, doct } = req.body

    const _idSponsor = await User.find({ email: req.authenticated.mailSignup })
    let idSponsor = await _idSponsor.map(el => { return el._id })
    const idOfSponsor = idSponsor.toString()
    const Fields = await Doct.find({ "_id": doct })
    const lengthFields = Fields.map(el => { return el.label }).pop()
    let workbook = XLSX.readFile(req.files.uploaded_file.path);
    let sheet_name_list = workbook.SheetNames;
    let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    const plan = `${Date.now().toString()}-${req.files.uploaded_file.name}`
    const sheet = plan.toString()
    let _titles = xlData[0]
    let titles = Object.keys(_titles)  
    let oneTitle = ""
    let headers = []
    for (let i = 0; titles.length > i; i++) {
      oneTitle = titles[i]
      headers.push(oneTitle)
    }
   

    let arr = []
    let vol = []
    let err = []
    const u = await User.find({ _id: req.authenticated._id })
    const username = u.map(el => { return el.name })   
    const stor = await Storehouse.find({ _id: storehouse })
    const checkStore = stor.map(el => { return el.mapStorehouse }).pop()
    let volumeTypeError=[]

    if ((headers.length - 1) !== lengthFields.length) {
      return next(new MethodNotAllowedError(`O DOCUMENTO POSSUI ${lengthFields.length} CAMPO(S) E SUA PLANILHA POSSUI ${headers.length - 1} COLUNA(S)!`))

    }
     
     let locationTitle = headers[0]     
     let indices= [headers.toString().split(",")].pop()
     let coluns = indices.slice(1)
     let colunLocation = indices.shift().toString()   

let idVo = ""
    
      for (let i = 0; xlData.length > i; i++) {
        let controlPos = await Position.find({ storehouse: storehouse, position: { $eq: xlData[i][colunLocation] } })
    let idPosition = controlPos.map(el => { return el._id }).toString()
    let checkPosition = controlPos.map(el => { return el.used }).toString()

   

let vid  = (await Volume.find({location:xlData[i][colunLocation]})).map(el=>{return el._id}).toString()

console.log("só uma vez")

if (vid){
  console.log("sem criar")
  idVo=vid
}else{
  let documentVol = new Volume({
    location:xlData[i][colunLocation],
    
    volumeType: "BOX",
    guardType: "GERENCIADA",
    status: "ATIVO",
    storehouse: req.body.storehouse,
    uniqueField: `${xlData[i][colunLocation]}-${storehouse}`,
    company: company,
    departament: departament,
    author: req.authenticated._id,
    mailSignup: req.authenticated.mailSignup,
    dateCreated: Date.now(),
    sheetImport: sheet,
    doct: doct,
    records: false
  })

  if (checkStore === true) {
    if (idPosition !== '') {
      if (JSON.parse(checkPosition) === false) {     
console.log("criando")
        await documentVol.save()
        idVo = documentVol._id
        await Position.update({ _id: idPosition }, { $set: { used: true, company: company, departament: departament } })
          .catch(next)
      }else{
        volumeTypeError.push({loc:xlData[i][colunLocation],erro:"VERIFIQUE A POSIÇÃO UTILIZADA CONFORME MAPA"})
      }
    }else{
      volumeTypeError.push({loc:xlData[i][colunLocation],erro:"VERIFIQUE A POSIÇÃO NÃO ENCONTRADA NO MAPA OU ATUALIZE O MAPA"})
    }


  }else{

    "Aqui é sem controle de mapa"

  }


}

      
        let documentAr = new Archive({
          company: company,
          departament: departament,
          storehouse: storehouse,
          volume: idVo,
          doct: doct,
          tag: Object.values( xlData[i]).slice(1),
          author: req.authenticated._id,
          mailSignup: req.authenticated.mailSignup,
          sponsor: idOfSponsor,
          sheetImport: sheet

        });
        documentAr.save()
        // console.log("importados",i)

        arr.push(-i.toString())
        // console.log(arr.length)
        bufferFrom(arr, 'uft8')
        // console.log(bufferFrom(arr, 'uft8'))
      }   
    

     resp.send({
       
       statusEndImportation:"importado"
      })



    // quantidades de colunas desconiderar a pmeiro sempre -1
  }



  applyRoutes(applycation: restify.Server) {
    
    applycation.post(`${this.basePath}/import`, [
      authorize("TYWIN", "DAENERYS"),
      this.import
    ]);
 
    
  }
}

export const archivesRouter = new ArchivesRouter();
