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
const admin = require('firebase-admin')

import { authenticate } from '../security/auth.handler';
import { authorize } from "../security/authz.handler";
import { Archive } from "./archives.model";
import { Volume } from "../volumes/volumes.model";
import { User } from "../users/users.model";
import { Doct } from '../docts/docts.model';
import { Sheetarchive } from '../sheetarchives/sheetarchives.model'
import { Position } from '../positions/positions.model'
import { Storehouse } from '../storehouses/storehouses.model'
import { environment } from "../common/environment";


admin.initializeApp({
  credential: admin.credential.cert({
    "type": environment.firebase.type,
    "project_id": environment.firebase.project_id,
    "private_key_id": environment.firebase.private_key_id,
    "private_key": environment.firebase.private_key,
    "client_email": environment.firebase.client_email,
    "client_id": environment.firebase.client_id,
    "auth_uri": environment.firebase.auth_uri,
    "token_uri": environment.firebase.token_uri,
    "auth_provider_x509_cert_url": environment.firebase.auth_provider_x509_cert_url,
    "client_x509_cert_url": environment.firebase.client_x509_cert_url
  }),
  databaseURL: environment.firebase.databaseURL
});


const db = admin.database();


class ArchivesRouter extends ModelRouter<Archive> {
  constructor() {
    super(Archive);
  }


  import = async (req, resp, next) => {


    const iconerror = environment.icons.iconerror
    const iconsuscess = environment.icons.iconsuscess




    const { id, sponsor, company, departament, storehouse, doct, sheet, dataSeet } = req.body
    let workbook = dataSeet    


    const _idSponsor = await User.find({ email: sponsor })
    let idSponsor = await _idSponsor.map(el => { return el._id })
    const idOfSponsor = idSponsor.toString()
    const Fields = await Doct.find({ "_id": doct })
    const lengthFields = Fields.map(el => { return el.label }).pop()

    
    // let workbook = XLSX.readFile(req.files.uploaded_file.path);
    let sheet_name_list = workbook.SheetNames;
    let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    const plan = sheet
    // const sheet = plan.toString()

    let _titles = xlData[0]
    let titles = Object.keys(_titles)
    let oneTitle = ""
    let headers = []
    for (let i = 0; titles.length > i; i++) {
      oneTitle = titles[i]
      headers.push(oneTitle)
    }

    const starCurrent = await Doct.findOne({ _id: req.body.doct })
    const currentTime = Number(starCurrent.dcurrentValue)
    // console.log("Tempo de data Corrente",currentTime)
    const intermediateTime = Number(starCurrent.dintermediateValue)
    // console.log("Tempo de data Intermediária",intermediateTime)
    const dfinal = starCurrent.dfinal
    // console.log("Destinação final",dfinal)    
    let array = starCurrent.label
    const docItem = array.findIndex((label, index, array) => label.timeControl === true)


    let arr = []
    let vol = []
    let err = []
    const u = await User.find({ _id: id })
    const username = u.map(el => { return el.name })
    const stor = await Storehouse.find({ _id: storehouse })
    const checkStore = stor.map(el => { return el.mapStorehouse }).pop()
    let typeError = []

  
    let locationTitle = headers[0]
    let indices = [headers.toString().split(",")].pop()
    let coluns = indices.slice(1)
    let colunLocation = indices.shift().toString()

    let idVo = ""
   
    if ((headers.length - 1) !== lengthFields.length) {
      // return next(new MethodNotAllowedError(`O DOCUMENTO POSSUI ${lengthFields.length} CAMPO(S) E SUA PLANILHA POSSUI ${headers.length - 1} COLUNA(S)!`))


      const newNotification = {
        title: "Importação de Arquivos",
        msg: `O DOCUMENTO POSSUI ${lengthFields.length} CAMPO(S) E SUA PLANILHA POSSUI ${headers.length - 1} COLUNA(S)!`,
        linkIcon: iconsuscess,
        user: id,
        mailSignup: sponsor,
        active: true,
        dateCreated: Date.now()
      }
      db.ref('notifications').push(newNotification)
        .catch(next)

    }


    if (checkStore === true) {
      

      for (let i = 0; xlData.length > i; i++) {   
        // console.log("estou aqui")     

        let controlPos = await Position.find({ storehouse: storehouse, position: { $eq: xlData[i][colunLocation] } })
        let idPosition = await controlPos.map(el => { return el._id }).toString()
        let checkPosition = await controlPos.map(el => { return el.used }).toString()

        let vid = (await Volume.find({
          location: xlData[i][colunLocation],
          storehouse: storehouse,
          company: company,
          departament: departament,
          volumeType: "BOX",
          guardType: "GERENCIADA",
          sheetImport: sheet,
          status: "ATIVO",
        })).map(el => { return el._id }).toString()

        // console.log("só uma vez")

        if (vid) {
          // console.log("sem criar")
          idVo = vid
        } else {
          let documentVol = new Volume({
            location: xlData[i][colunLocation],
            volumeType: "BOX",
            guardType: "GERENCIADA",
            status: "ATIVO",
            storehouse: storehouse,
            uniqueField: `${xlData[i][colunLocation]}-${storehouse}`,
            company: company,
            departament: departament,
            author: id,
            mailSignup: sponsor,
            dateCreated: Date.now(),
            sheetImport: sheet,
            doct: doct,
            records: false
          })


          if (idPosition !== '') {
            if (JSON.parse(checkPosition) === false) {
              // console.log("criando")
              await documentVol.save()
              idVo = documentVol._id
              await Position.update({ _id: idPosition }, { $set: { used: true, company: company, departament: departament } })
                .catch(next)
            } else {
              typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO, JÁ PODE ESTA EM USO POR OUTRO DEPARTAMENTO OU EMPRESA!", tag: Object.values(xlData[i]).slice(1), location: xlData[i][colunLocation] })

            }
          } else {
            typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO, NÃO ENCONTRADA NO MAPA OU ATUALIZE O MAPA!", tag: Object.values(xlData[i]).slice(1), location: xlData[i][colunLocation] })

          }
        }
        if (idVo === "") {
          // console.log("deu ruin não tem id")

        } else {
          if (docItem === -1) {
            const documentAr = new Archive({
              company: company,
              departament: departament,
              storehouse: storehouse,
              volume: idVo,
              doct: doct,
              tag: Object.values(xlData[i]).slice(1),
              author: id,
              mailSignup: sponsor,
              sponsor: idOfSponsor,
              sheetImport: sheet

            });
            documentAr.save()
              ///sinaliza se a caixa contem registros.
              .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
              .catch(next);
            console.log("importados",i)

            arr.push(-i.toString())

          } else {
            //com data
            let tg = Object.values(xlData[i]).slice(1)
            let init = tg
            //PROCURA A DATA DENTRO DO TEXTO PELA POSIÇÃO DO LABEL DO INDICE
            let d2 = [{
              data2: (init[docItem])
            }]

            let dataSplit2 = d2.map(el => { return el.data2 }).toString()
            let patternDATAFULL = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/
            let patternCompt = /[0-9]{2}\/[0-9]{4}$/
            let patternYYYY = /[0-9]{4}$/

            if (patternDATAFULL.test(dataSplit2)) {
              // console.log("a DAta "+dataSplit2+" está correta.")
              let d = dataSplit2.split("/")

              let year = Number(d[2])
              let mounth = Number(d[1])
              let day = Number(d[0])
              let startDateCurrent = new Date(year, mounth - 1, day + 1)
              let finalDateCurrent = new Date(year + currentTime, mounth - 1, day + 1)

              let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day + 1)
              // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
              let document = new Archive({
                company: company,
                departament: departament,
                storehouse: storehouse,
                volume: idVo,
                doct: doct,
                tag: Object.values(xlData[i]).slice(1),
                author: id,
                mailSignup: sponsor,
                sponsor: idOfSponsor,
                sheetImport: sheet,
                //  create: dtaa,
                startDateCurrent: startDateCurrent,
                finalDateCurrent: finalDateCurrent,
                finalDateIntermediate: finalDateIntermediate,
                finalFase: dfinal

              });
              await document.save()
                .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                .catch(next);
              vol.push(document)

            } else if (patternCompt.test(dataSplit2)) {
              let ds = dataSplit2.split("/")
              let year = Number(ds[1])
              let mounth = Number(ds[0])
              let startDateCurrent = new Date(year, mounth - 1, 1)
              let finalDateCurrent = new Date(year + currentTime, mounth - 1, 1)
              let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, 1)
              // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
              let document = new Archive({
                company: company,
                departament: departament,
                storehouse: storehouse,
                volume: idVo,
                doct: doct,
                tag: Object.values(xlData[i]).slice(1),
                author: id,
                mailSignup: sponsor,
                sponsor: idOfSponsor,
                sheetImport: sheet,
                //  create: dtaa,
                startDateCurrent: startDateCurrent,
                finalDateCurrent: finalDateCurrent,
                finalDateIntermediate: finalDateIntermediate,
                finalFase: dfinal

              });
              await document.save()
                .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                .catch(next);
              vol.push(document)
            } else if (patternYYYY.test(dataSplit2)) {

              let year = Number(dataSplit2)
              let mounth = Number(12)
              let day = Number(31)
              let startDateCurrent = new Date(year, mounth - 1, day)

              let finalDateCurrent = new Date(year + currentTime, mounth - 1, day)

              let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day)

              // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
              let document = new Archive({
                company: company,
                departament: departament,
                storehouse: storehouse,
                volume: idVo,
                doct: doct,
                tag: Object.values(xlData[i]).slice(1),
                author: id,
                mailSignup: sponsor,
                sponsor: idOfSponsor,
                sheetImport: sheet,
                //  create: dtaa,
                startDateCurrent: startDateCurrent,
                finalDateCurrent: finalDateCurrent,
                finalDateIntermediate: finalDateIntermediate,
                finalFase: dfinal

              });
              await document.save()
                .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                .catch(next);
              vol.push(document)
            } else {
              //aqui vai erros
              typeError.push({ row: i + 1, msgError: "VERIFIQUE A CONFIGURAÇÃO DE TEMPORALIDADE DESSE DOCUMENTO!", tag: Object.values(xlData[i]).slice(1), location: xlData[i][colunLocation] })
              console.log("tem erros aqui")
            }
          }
        }
      }
    } else {

      for (let i = 0; xlData.length > i; i++) {

        // console.log("bora indexar")

        let vid = (await Volume.find({
          location: xlData[i][colunLocation],
          storehouse: storehouse,
          company: company,
          departament: departament,
          volumeType: "BOX",
          guardType: "GERENCIADA",
          status: "ATIVO",
        })).map(el => { return el._id }).toString()       

        if (vid) {
        
          idVo = vid
        } else {
          let documentVol = new Volume({
            location: xlData[i][colunLocation],
            volumeType: "BOX",
            guardType: "GERENCIADA",
            status: "ATIVO",
            storehouse: storehouse,
            uniqueField: `${xlData[i][colunLocation]}-${storehouse}`,
            company: company,
            departament: departament,
            author: id,
            mailSignup: sponsor,
            dateCreated: Date.now(),
            sheetImport: sheet,
            doct: doct,
            records: false
          })



          let v = await Volume.find({
            mailSignup: sponsor,
            location: xlData[i][colunLocation],
            storehouse: storehouse,
            status: { $ne: "BAIXADO" }
          })

          if (v.length === 0) {

            await documentVol.save()
            idVo = documentVol._id


          } else {
            typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO JA ESTA EM USO!", tag: Object.values(xlData[i]).slice(1), location: xlData[i][colunLocation] })
            // catch(next)
         

          }

        }

        //AQUI COMEÇA A INDEXAÇÃO 
        if (idVo === "") {



        } else {
          if (docItem === -1) {
            const documentAr = new Archive({
              company: company,
              departament: departament,
              storehouse: storehouse,
              volume: idVo,
              doct: doct,
              tag: Object.values(xlData[i]).slice(1),
              author: id,
              mailSignup: sponsor,
              sponsor: idOfSponsor,
              sheetImport: sheet

            });
            documentAr.save()

              .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
              .catch(next);

            arr.push(-i.toString())

          } else {
            //com data
            let tg = Object.values(xlData[i]).slice(1)
            let init = tg
            //PROCURA A DATA DENTRO DO TEXTO PELA POSIÇÃO DO LABEL DO INDICE
            let d2 = [{
              data2: (init[docItem])
            }]

            let dataSplit2 = d2.map(el => { return el.data2 }).toString()
            let patternDATAFULL = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/
            let patternCompt = /[0-9]{2}\/[0-9]{4}$/
            let patternYYYY = /[0-9]{4}$/

            if (patternDATAFULL.test(dataSplit2)) {
              // console.log("a DAta "+dataSplit2+" está correta.")
              let d = dataSplit2.split("/")

              let year = Number(d[2])
              let mounth = Number(d[1])
              let day = Number(d[0])
              let startDateCurrent = new Date(year, mounth - 1, day + 1)
              let finalDateCurrent = new Date(year + currentTime, mounth - 1, day + 1)

              let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day + 1)
              // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
              let document = new Archive({
                company: company,
                departament: departament,
                storehouse: storehouse,
                volume: idVo,
                doct: doct,
                tag: Object.values(xlData[i]).slice(1),
                author: id,
                mailSignup: sponsor,
                sponsor: idOfSponsor,
                sheetImport: sheet,
                //  create: dtaa,
                startDateCurrent: startDateCurrent,
                finalDateCurrent: finalDateCurrent,
                finalDateIntermediate: finalDateIntermediate,
                finalFase: dfinal

              });
              await document.save()
                .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                .catch(next);
              vol.push(document)

            } else if (patternCompt.test(dataSplit2)) {
              let ds = dataSplit2.split("/")
              let year = Number(ds[1])
              let mounth = Number(ds[0])
              let startDateCurrent = new Date(year, mounth - 1, 1)
              let finalDateCurrent = new Date(year + currentTime, mounth - 1, 1)
              let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, 1)
              // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
              let document = new Archive({
                company: company,
                departament: departament,
                storehouse: storehouse,
                volume: idVo,
                doct: doct,
                tag: Object.values(xlData[i]).slice(1),
                author: id,
                mailSignup: sponsor,
                sponsor: idOfSponsor,
                sheetImport: sheet,
                //  create: dtaa,
                startDateCurrent: startDateCurrent,
                finalDateCurrent: finalDateCurrent,
                finalDateIntermediate: finalDateIntermediate,
                finalFase: dfinal

              });
              await document.save()
                .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                .catch(next);
              vol.push(document)
            } else if (patternYYYY.test(dataSplit2)) {

              let year = Number(dataSplit2)
              let mounth = Number(12)
              let day = Number(31)
              let startDateCurrent = new Date(year, mounth - 1, day)

              let finalDateCurrent = new Date(year + currentTime, mounth - 1, day)

              let finalDateIntermediate = new Date(year + (currentTime + intermediateTime), mounth - 1, day)

              // console.log(" MMYYY Start current"+startDateCurrent+"finalDaeCurrent"+finalDateCurrent+"finalDate Intermediate"+ finalDateIntermediate)
              let document = new Archive({
                company: company,
                departament: departament,
                storehouse: storehouse,
                volume: idVo,
                doct: doct,
                tag: Object.values(xlData[i]).slice(1),
                author: id,
                mailSignup: sponsor,
                sponsor: idOfSponsor,
                sheetImport: sheet,
                //  create: dtaa,
                startDateCurrent: startDateCurrent,
                finalDateCurrent: finalDateCurrent,
                finalDateIntermediate: finalDateIntermediate,
                finalFase: dfinal

              });
              await document.save()
                .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                .catch(next);
              vol.push(document)
            } else {
              //aqui vai erros
              typeError.push({ row: i + 1, msgError: "VERIFIQUE A CONFIGURAÇÃO DE TEMPORALIDADE DESSE DOCUMENTO!", tag: Object.values(xlData[i]).slice(1), location: xlData[i][colunLocation] })

            }
          }
        }

      }


    }

    if (typeError.length === 0) {

      const newNotification = {
        title: "Importação de Arquivos",
        msg: `Foram importados ${xlData.length} Arquivos com Suscesso!`,
        linkIcon: iconsuscess,
        user: id,
        mailSignup: sponsor,
        active: true,
        dateCreated: Date.now()
      }
      db.ref('notifications').push(newNotification)
        .catch(next)
      // console.log("sem erros")
    } else {

      let documentError = new Sheetarchive({
        sheet: sheet,
        mailSignup: sponsor,
        logErrors: typeError
      })
      await documentError.save()

      let sheetErros = `/sheetarchives/excel/${documentError.id}`

      const newNotification = {
        title: "Importação de Arquivos com erros",
        msg: `Foram importados ${xlData.length -typeError.length} Arquivos com Suscesso, e não Importados ${typeError.length} Aquivos!`,
        linkIcon: iconerror,
        attachment: sheetErros,
        user: id,
        mailSignup: sponsor,
        active: true,
        dateCreated: Date.now()
      }
      db.ref('notifications').push(newNotification)
        .catch(next)
      resp.send()
    }
    next
    // quantidades de colunas desconiderar a pmeiro sempre -1
  }



  applyRoutes(applycation: restify.Server) {
    applycation.post(`${this.basePath}/import`, [

      this.import
    ]);


  }
}

export const archivesRouter = new ArchivesRouter();
