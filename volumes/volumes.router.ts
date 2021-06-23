
import * as restify from "restify";
import * as mongoose from "mongoose";
import * as cluster from 'cluster';
import * as child_process from 'child_process';

import amqp = require('amqplib/callback_api');
const admin = require('firebase-admin')


import { ModelRouter } from "../common/model-router";
import { Volume } from "./volumes.model";
import { User } from "../users/users.model";
import { Departament } from '../departaments/departaments.model';
import { Sheetvolume } from "../sheetvolumes/sheetvolumes.model";
import { Position } from '../positions/positions.model';
import { Storehouse } from '../storehouses/storehouses.model';
import { environment } from '../common/environment'
import { MethodNotAllowedError } from "restify-errors";
import { Notifier } from "../notifiers/notifiers.model";
var XLSX = require('xlsx')

const bufferFrom = require('buffer-from')


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


class VolumesRouter extends ModelRouter<Volume> {
  constructor() {
    super(Volume);
  }

  protected prepareOne(
    query: mongoose.DocumentQuery<Volume, Volume>
  ): mongoose.DocumentQuery<Volume, Volume> {
    return query
      .populate("storehouse", "name")
      .populate("company", "name")
      .populate("departament", "name")
      .populate("volumeLoan.stastatLoan");
  }

  envelop(document) {
    let resource = super.envelope(document);
    resource._links.listSeal = `${this.basePath}/${resource._id}/listSeal`;
    return resource;
  }



  import = async (req, resp, next) => {

    const { id, sponsor, volumeType, company, departament, storehouse, guardType, sheet, dataSeet } = req.body
    const iconerror = environment.icons.iconerror
    const iconsuscess = environment.icons.iconsuscess
    let workbook = dataSeet
    let sheet_name_list = workbook.SheetNames;
    let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    const plan = `${Date.now().toString()}-${sheet}`
    // const sheet = plan.toString()
    let _titles = xlData[0]
    let titles = Object.keys(_titles)
    let oneTitle = ""
    let headers = []
    try {
      for (let i = 0; titles.length > i; i++) {
        oneTitle = titles[i]
        headers.push(oneTitle)
      }

      let locationTitle = headers[0].toString()
      let obs = headers[1].toString()
      let ref = ""
      let seal = ""

      if (guardType == "SIMPLES") {
        ref = headers[2].toString()
        seal = headers[3].toString()
      } else {
        ref = ""
        seal = ""
      }

      let arr = []
      let vol = []
      let err = []


      const stor = await Storehouse.find({ _id: storehouse })
      const checkStore = stor.map(el => { return el.mapStorehouse }).pop()
      let documentError = new Sheetvolume({
        sheet: sheet,
        mailSignup: sponsor

      })
      await documentError.save()

      for (let i = 0; xlData.length > i; i++) {

        let document = new Volume({
          location: xlData[i][locationTitle],
          volumeType: volumeType,
          guardType: guardType,
          storehouse: storehouse,
          uniqueField: `${xlData[i][locationTitle]}-${storehouse}`,
          company: company,
          departament: departament,
          comments: xlData[i][obs] || " ",
          seal: xlData[i][seal] || "",
          reference: xlData[i][ref] || "",
          author: id,
          sheetImport: sheet,
          mailSignup: sponsor
        })

        if (checkStore === true) {


          let controlPos = await Position.find({ storehouse: storehouse, position: { $eq: xlData[i][locationTitle] } })
          let idPosition = controlPos.map(el => { return el._id }).toString()
          let checkPosition = controlPos.map(el => { return el.used }).toString()

          if (idPosition !== '') {
            if (JSON.parse(checkPosition) === false) {


              vol.push(document)
              document.save()
              await Position.update({ _id: idPosition }, { $set: { used: true, company: company, departament: departament } })
                .catch(next)
            } else {

              err.push(xlData[i][locationTitle])
              let row = i + 1

              let log =
              {

                "row": row,
                "msgError": "ESTA CAIXA NÃO ESTÁ CADASTRADA NO MAPA DE DEPÓSITO!",
                "location": xlData[i][locationTitle],

              }
              Sheetvolume.findOneAndUpdate(
                { _id: documentError },
                { $push: { logErrors: log } },
                function (error, success) {
                  if (error) {
                    // console.log(error);
                  } else {
                    return next(new MethodNotAllowedError(`OPSS ALGO DE ARREDADO ACONTECEU!`))
                  }
                })
            }

          } else {

            err.push(xlData[i][locationTitle])
            let row = i + 1
            let log2 =
            {
              "row": row,
              "msgError": "ESTÁ CAIXA JÁ ESTÁ EM USO!",
              "location": xlData[i][locationTitle]
            }
            Sheetvolume.findOneAndUpdate(
              { _id: documentError },
              { $push: { logErrors: log2 } },
              function (error, success) {
                if (error) {
                  return next(new MethodNotAllowedError(`OPSS ALGO DE ARREDADO ACONTECEU!`))

                } else {

                }
              })
          }

        } else {

          var v = await Volume.find({
            mailSignup: sponsor,
            location: { $eq: xlData[i][locationTitle] },
            storehouse: storehouse,
            departament: departament,
            status: { $ne: "BAIXADO" }
          })
          if (v.length === 0) {
            vol.push(document)
            await document.save()
          } else {
            err.push(xlData[i][locationTitle])
            let row = i + 1
            let log3 =
            {
              "row": row,
              "msgError": "ESTÁ CAIXA JÁ ESTÁ EM USO!",
              "location": xlData[i][locationTitle]
            }
            Sheetvolume.findOneAndUpdate(
              { _id: documentError },
              { $push: { logErrors: log3 } },
              function (error, success) {
                if (error) {
                  return next(new MethodNotAllowedError(`OPSS ALGO DE ARREDADO ACONTECEU!`))

                } else {

                }
              })
          }
        }

        arr.push(i.toString())
        console.log(arr.length)


      }

      let sheetErros = ""
      let sheetID = await Sheetvolume.find({ sheet: sheet, mailSignup: sponsor })
      let _sheetID = sheetID.map(el => { return el._id });



      if (err.length === 0) {
        await Sheetvolume.remove({ _id: sheetID[0] })
        sheetErros = "Não foi Registrado Erros"

        const newNotification = {
          title: "Importação de Volumes",
          msg: `Foram importados ${vol.length} Volumes com Suscesso!`,
          linkIcon: iconsuscess,
          user: id,
          mailSignup: sponsor,
          active: true,
          dateCreated: Date.now()
        }
        db.ref('notifications').push(newNotification)
          .catch(next)
      } else {
        sheetErros = `/sheetvolumes/excel/${_sheetID[0]}`
        const newNotification = {
          title: "Importação de Volumes com erros",
          msg: `Foram importados ${vol.length} Volumes com Suscesso, e não Importados ${err.length} Volumes!`,
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

    } catch (e) {
      const newNotification = {
        title: "Importação de Volumes com erros",
        msg: `POR FAVOR VERIFIQUE A FORMATAÇÃO DA SUA PLANILHA - ${sheet}!`,
        linkIcon: iconerror,
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
  }









  applyRoutes(applycation: restify.Server) {
    applycation.post(`${this.basePath}/import`, [

      this.import
    ]);


  }
}

export const volumesRouter = new VolumesRouter();
