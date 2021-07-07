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
import { Archive } from "./archives.model";
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
    const u = await User.find({ _id: req.authenticated._id })
    const username = u.map(el => { return el.name })
    const stor = await Storehouse.find({ _id: storehouse })
    const checkStore = stor.map(el => { return el.mapStorehouse }).pop()
    let typeError = []

    if ((headers.length - 1) !== lengthFields.length) {
      return next(new MethodNotAllowedError(`O DOCUMENTO POSSUI ${lengthFields.length} CAMPO(S) E SUA PLANILHA POSSUI ${headers.length - 1} COLUNA(S)!`))

    }

    let locationTitle = headers[0]
    let indices = [headers.toString().split(",")].pop()
    let coluns = indices.slice(1)
    let colunLocation = indices.shift().toString()

    let idVo = ""

    if (checkStore === true) {

      for (let i = 0; xlData.length > i; i++) {

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
          status: "ATIVO",
        })).map(el => { return el._id }).toString()

        console.log("só uma vez")

        if (vid) {
          console.log("sem criar")
          idVo = vid
        } else {
          let documentVol = new Volume({
            location: xlData[i][colunLocation],
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


          if (idPosition !== '') {
            if (JSON.parse(checkPosition) === false) {
              console.log("criando")
              await documentVol.save()
              idVo = documentVol._id
              await Position.update({ _id: idPosition }, { $set: { used: true, company: company, departament: departament } })
                .catch(next)
            } else {
              typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO, JÁ PODE ESTA EM USO POR OUTRO DEPARTAMENTO OU EMPRESA!", location: xlData[i][colunLocation] })

            }
          } else {
            typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO, NÃO ENCONTRADA NO MAPA OU ATUALIZE O MAPA!", location: xlData[i][colunLocation] })

          }
        }
        if (idVo === "") {
          console.log("deu ruin não tem id")

        } else {
          if (currentTime === 0) {
            const documentAr = new Archive({
              company: company,
              departament: departament,
              storehouse: storehouse,
              volume: idVo,
              doct: doct,
              tag: Object.values(xlData[i]).slice(1),
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              sheetImport: sheet

            });
            documentAr.save()
              ///sinaliza se a caixa contem registros.
              .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
              .catch(next);
            // console.log("importados",i)

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
                author: req.authenticated._id,
                mailSignup: req.authenticated.mailSignup,
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
                author: req.authenticated._id,
                mailSignup: req.authenticated.mailSignup,
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
                author: req.authenticated._id,
                mailSignup: req.authenticated.mailSignup,
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
              typeError.push({ row: i + 1, msgError: "VERIFIQUE A CONFIGURAÇÃO DE TEMPORALIDADE DESSE DOCUMENTO!", location: xlData[i][colunLocation] })
              console.log("tem erros aqui")
            }
          }
        }
      }
    } else {

      for (let i = 0; xlData.length > i; i++) {

        console.log("bora indexar")

        let vid = (await Volume.find({
          location: xlData[i][colunLocation],
          storehouse: storehouse,
          company: company,
          departament: departament,
          volumeType: "BOX",
          guardType: "GERENCIADA",
          status: "ATIVO",
        })).map(el => { return el._id }).toString()

        console.log("só uma vez")

        if (vid) {
          console.log("sem criar")
          idVo = vid
        } else {
          let documentVol = new Volume({
            location: xlData[i][colunLocation],
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

        

          let v = await Volume.find({
            mailSignup: req.authenticated.mailSignup,
            location: xlData[i][colunLocation],
            storehouse: storehouse,
            status: { $ne: "BAIXADO" }
          })

          if (v.length === 0) {

            await documentVol.save()
            idVo = documentVol._id


          } else {
            typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO JA ESTA EM USO!", location: xlData[i][colunLocation] })
            // catch(next)
            // console.log("CAIXA EM USO")

          }
          
        }


        
        //AQUI COMEÇA A INDEXAÇÃO 
        if (idVo === "") {
           console.log("criar a caixa")
          

        } else {
          if (currentTime === 0) {
            const documentAr = new Archive({
              company: company,
              departament: departament,
              storehouse: storehouse,
              volume: idVo,
              doct: doct,
              tag: Object.values(xlData[i]).slice(1),
              author: req.authenticated._id,
              mailSignup: req.authenticated.mailSignup,
              sponsor: idOfSponsor,
              sheetImport: sheet

            });
            documentAr.save()
              ///sinaliza se a caixa contem registros.
              .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
              .catch(next);
            // console.log("importados",i)

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
                author: req.authenticated._id,
                mailSignup: req.authenticated.mailSignup,
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
                author: req.authenticated._id,
                mailSignup: req.authenticated.mailSignup,
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
                author: req.authenticated._id,
                mailSignup: req.authenticated.mailSignup,
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
              typeError.push({ row: i + 1, msgError: "VERIFIQUE A CONFIGURAÇÃO DE TEMPORALIDADE DESSE DOCUMENTO!", location: xlData[i][colunLocation] })
              console.log("tem erros aqui")
            }
          }
        }


        //////





      }


    }

      console.log(typeError)


    resp.send({

      statusEndImportation: "importado",
      erros: typeError
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
