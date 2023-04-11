
import { environment } from "../common/environment";
import xl = require('excel4node')
import { User } from "../users/users.model";
import { Doct } from "../docts/docts.model";
import { Storehouse } from "../storehouses/storehouses.model";
import { Sheetarchive } from "../sheetarchives/sheetarchives.model";
import { setCronVolumes } from "../libary/flagVolumes";
import { Volume } from "../volumes/volumes.model";
import { Archive } from "./archives.model";
import { Position } from "../positions/positions.model";
import { sendQueusCalculateItens, sendQueuesVolumeRetention } from "../queues/producer";
import { validateDate } from "../pipes/validateDate";
import { calcTemporality } from "../pipes/calcTemporality";
const XLSX = require('xlsx')
const admin = require('firebase-admin')


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
const importArchives = async (data) => {
    // console.log(JSON.stringify(data))
    const {
        user,
        sponsor,
        company,
        doct,
        departament,
        storehouse,
        sheet,
        retroDate,
        dataSeet
    } = data




    var iconerror = environment.icons.iconerror
    var iconsuscess = environment.icons.iconsuscess
    const id = user


    let workbook = dataSeet
    var userd = id
    var sponsored = sponsor


    const _idSponsor = await User.find({ email: sponsor })
    let idSponsor = await _idSponsor.map(el => { return el._id })
    const idOfSponsor = idSponsor.toString()
    const { dintermediateValue, dcurrentValue, dfinal, label } = await Doct.findOne({ _id: doct })
    const indexOfTemporality = label.findIndex((label, index, array) => label.timeControl === true)// retorno da posição na qual o timeControl está ativo.
    const dataStorehouse = await Storehouse.find({ _id: storehouse })
    const flagStorehouse = await JSON.parse(dataStorehouse.map(el => { return el.virtualHd }).toString())
    // const lengthFields = Fields.map(el => { return el.label }).pop()
    const lengthFields = label
    let retroOrPresent = false
    let sheet_name_list = workbook.SheetNames;
    const xlData = XLSX.utils.sheet_to_json(await workbook.Sheets[sheet_name_list[0]], { defval: "-" })




    const plan = sheet


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
    let columnDataRetro = undefined
    const u = await User.find({ _id: id })
    const username = u.map(el => { return el.name })

    const checkStore = dataStorehouse.map(el => { return el.mapStorehouse }).pop()
    let typeError = []
    let sizeArray = 1
    let sizeSlice = 1


    let locationTitle = headers[0]
    let indices = [headers.toString().split(",")].pop()
    let indicesRetro = [headers[1].toString().split(",")].pop()
    let coluns = indices.slice(sizeSlice)
    let colunLocation = indices.shift().toString()
    const retro = Boolean(JSON.parse(retroDate));

    if (retro) {
        columnDataRetro = indicesRetro.shift().toString()
        sizeArray = 2
        sizeSlice = 2

    }

    let idVo = ""


    if (headers.length - sizeArray !== lengthFields.length) {

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
            .catch((e) => console.error(e))

    }

    let idMessage = null


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
                // sheetImport: sheet,
                status: "ATIVO",
            }))
                .map(el => { return el._id }).toString()


            if (vid) {

                idVo = vid

            } else {


                let creaDate = new Date()

                if (xlData[i][columnDataRetro] !== undefined) {

                    let nDATE = xlData[i][columnDataRetro].toString().split("/")

                    let yearr = Number(nDATE[2])
                    let mounthh = Number(nDATE[1])
                    let dayy = Number(nDATE[0])
                    creaDate = new Date(yearr, mounthh - 1, dayy)


                }

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
                    dateCreated: xlData[i][columnDataRetro] == undefined ? Date.now() : creaDate,
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
                            .catch((e) => console.error(e))
                    } else {
                        typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO, JÁ PODE ESTA EM USO POR OUTRO DEPARTAMENTO OU EMPRESA!", tag: Object.values(xlData[i]).slice(sizeSlice), location: xlData[i][colunLocation] })

                    }
                } else {
                    typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO, NÃO ENCONTRADA NO MAPA OU ATUALIZE O MAPA!", tag: Object.values(xlData[i]).slice(sizeSlice), location: xlData[i][colunLocation] })

                }
            }
            if (idVo === "") {
                // console.log("deu ruin não tem id")

            } else {
                if (indexOfTemporality === -1) {

                    let creaDate = new Date()

                    if (xlData[i][columnDataRetro] !== undefined) {

                        let nDATE = xlData[i][columnDataRetro].toString().split("/")

                        let yearr = Number(nDATE[2])
                        let mounthh = Number(nDATE[1])
                        let dayy = Number(nDATE[0])
                        creaDate = new Date(yearr, mounthh - 1, dayy)


                    }
                    const documentAr = new Archive({
                        company: company,
                        departament: departament,
                        storehouse: storehouse,
                        volume: idVo,
                        doct: doct,
                        tag: Object.values(xlData[i]).slice(sizeSlice),
                        author: id,
                        mailSignup: sponsor,
                        sponsor: idOfSponsor,
                        create: xlData[i][columnDataRetro] == undefined ? Date.now() : creaDate,
                        sheetImport: sheet

                    });
                    documentAr.save()



                        .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                        .catch((e) => console.error(e))

                    

                    const dataSend = {
                        volume: idVo,
                        doct: doct,
                        departament: departament,
                        company: company,
                        action: "CREATE",
                        archive: doct

                    }
                    if (flagStorehouse != true) {
                        sendQueusCalculateItens(dataSend)
                    }

                    arr.push(-i.toString())

                } else {

                    let tg = Object.values(xlData[i]).slice(sizeSlice)
                    
                    let init = tg

                    let d2 = [{
                        data2: (init[indexOfTemporality])
                    }]

                    let dataSplit2 = d2.map(el => { return el.data2 }).toString()

                    const validateData = await validateDate(dataSplit2)

                    if (validateData.error === true) {
                        typeError.push({ row: i + 1, msgError: "ESTE CAMPO DE POSSUIR UMA DATA VÁLIDA!!!!", tag: Object.values(xlData[i]).slice(sizeSlice), location: xlData[i][colunLocation] })

                    } else {

                        const calculate = await calcTemporality(validateData, dataSplit2, dintermediateValue, dcurrentValue, dfinal)

                        if (calculate.error === true) {
                            typeError.push({ row: i + 1, msgError: "VERIFIQUE A CONFIGURAÇÃO DE TEMPORALIDADE DESSE DOCUMENTO!", tag: Object.values(xlData[i]).slice(sizeSlice), location: xlData[i][colunLocation] })
                        } else {


                            let creaDate = new Date()

                            if (xlData[i][columnDataRetro] !== undefined) {

                                let nDATE = xlData[i][columnDataRetro].toString().split("/")

                                let yearr = Number(nDATE[2])
                                let mounthh = Number(nDATE[1])
                                let dayy = Number(nDATE[0])
                                creaDate = new Date(yearr, mounthh - 1, dayy)


                            }
                            let document = new Archive({
                                company: company,
                                departament: departament,
                                storehouse: storehouse,
                                volume: idVo,
                                doct: doct,
                                tag: Object.values(xlData[i]).slice(sizeSlice),
                                author: id,
                                mailSignup: sponsor,
                                sponsor: idOfSponsor,
                                sheetImport: sheet,
                                create: xlData[i][columnDataRetro] == undefined ? Date.now() : creaDate,
                                startDateCurrent: calculate.startDateCurrent,
                                finalDateCurrent: calculate.finalDateCurrent,
                                finalDateIntermediate: calculate.finalDateIntermediate,
                                finalFase: calculate.finalFase

                            });

                            const dataSend = {
                                volume: idVo,
                                doct: doct,
                                dintermediateValue: dintermediateValue,
                                dcurrentValue: dcurrentValue,
                                dfinal: dfinal,
                                indexTemporality: indexOfTemporality,
                                departament: departament,
                                company: company,
                                action: "CREATE",
                                archive: document._id

                            }
                            await document.save()

                                .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                                .catch((e) => console.error(e))

                            if (flagStorehouse != true) {
                                sendQueuesVolumeRetention(dataSend)
                            }

                            vol.push(document)
                        }

                    }
                }
            }



            if (idMessage === null) {


                const newNotification = {
                    title: `SERÃO PROCESSADOS ${xlData.length - 1} REGISTROS.`,
                    msg: `AGUARDE.....`,
                    linkIcon: iconsuscess,
                    user: 'upload-' + id.toString(),
                    mailSignup: sponsor,
                    active: true,
                    importStatus: true,
                    dateCreated: Date.now()
                }
                db.ref('notifications').push(newNotification)
                    .on('value', function (snapshot) {
                        let idmsg = snapshot.key;
                        idMessage = idmsg

                    })

            }
            // status de importacao futuro
            let updateMssg = {
                title: `IMPORTACAO EM ANDAMENTO....FIQUE TRANQUILO`,
                msg: `LENDO A LINHA ${i}.`,
                linkIcon: iconsuscess,
                user: 'upload-' + id.toString(),
                mailSignup: sponsor,
                active: true,
                importStatus: true,
                dateCreated: Date.now()
            }
            db.ref('notifications/' + idMessage)
                .set(updateMssg)
        }


    } else {

        for (let i = 0; xlData.length > i; i++) {
            // console.log("estou aqui")
            // console.log("caixa", xlData[i][columnDataRetro])


            let vid = (await Volume.find({
                location: xlData[i][colunLocation],
                storehouse: storehouse,
                company: company,
                departament: departament,
                volumeType: "BOX",
                guardType: "GERENCIADA",
                status: "ATIVO"
            })).map(el => { return el._id }).toString()

            if (vid) {

                idVo = vid
            } else {

                let creaDate = new Date()

                if (xlData[i][columnDataRetro] !== undefined) {

                    let nDATE = xlData[i][columnDataRetro].toString().split("/")

                    let yearr = Number(nDATE[2])
                    let mounthh = Number(nDATE[1])
                    let dayy = Number(nDATE[0])
                    creaDate = new Date(yearr, mounthh - 1, dayy)


                }
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
                    dateCreated: xlData[i][columnDataRetro] == undefined ? Date.now() : creaDate,
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
                    typeError.push({ row: i + 1, msgError: "VERIFIQUE A POSIÇÃO JA ESTA EM USO!", tag: Object.values(xlData[i]).slice(sizeSlice), location: xlData[i][colunLocation] })
                    // catch(next)


                }

            }

            //AQUI COMEÇA A INDEXAÇÃO 
            if (idVo === "") {



            } else {



                if (indexOfTemporality === -1) {

                    let creaDate = new Date()

                    if (xlData[i][columnDataRetro] !== undefined) {

                        let nDATE = xlData[i][columnDataRetro].toString().split("/")

                        let yearr = Number(nDATE[2])
                        let mounthh = Number(nDATE[1])
                        let dayy = Number(nDATE[0])
                        creaDate = new Date(yearr, mounthh - 1, dayy)


                    }
                    const documentAr = new Archive({
                        company: company,
                        departament: departament,
                        storehouse: storehouse,
                        volume: idVo,
                        doct: doct,
                        tag: Object.values(xlData[i]).slice(sizeSlice),
                        author: id,
                        mailSignup: sponsor,
                        sponsor: idOfSponsor,
                        sheetImport: sheet,
                        create: xlData[i][columnDataRetro] == undefined ? Date.now() : creaDate,

                    });
                    const dataSend = {
                        volume: idVo,
                        doct: doct,
                        departament: departament,
                        company: company,
                        action: "CREATE",
                        archive: doct

                    }
                    documentAr.save()

                        .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                        .then(() => {
                            if (flagStorehouse != true) {
                                sendQueusCalculateItens(dataSend)
                            }
                        })
                        .catch((e) => console.error(e))


                    arr.push(-i.toString())

                } else {

                    let tg = Object.values(xlData[i]).slice(sizeSlice)
                    let init = tg

                    let d2 = [{
                        data2: (init[indexOfTemporality])
                    }]


                    const dataSplit2 = d2.map(el => { return el.data2 }).toString()

                    const validateData = await validateDate(dataSplit2)


                    if (validateData.error === true) {
                        typeError.push({ row: i + 1, msgError: "ESTE CAMPO DE POSSUIR UMA DATA VÁLIDA!!!!", tag: Object.values(xlData[i]).slice(sizeSlice), location: xlData[i][colunLocation] })
                    } else {
                        const calculate = await calcTemporality(validateData, dataSplit2, dintermediateValue, dcurrentValue, dfinal)

                        if (calculate.error === true) {
                            typeError.push({ row: i + 1, msgError: "VERIFIQUE A CONFIGURAÇÃO DE TEMPORALIDADE DESSE DOCUMENTO!", tag: Object.values(xlData[i]).slice(sizeSlice), location: xlData[i][colunLocation] })
                        } else {

                            let creaDate = new Date()

                            if (xlData[i][columnDataRetro] !== undefined) {

                                let nDATE = xlData[i][columnDataRetro].toString().split("/")

                                let yearr = Number(nDATE[2])
                                let mounthh = Number(nDATE[1])
                                let dayy = Number(nDATE[0])
                                creaDate = new Date(yearr, mounthh - 1, dayy)


                            }
                            let document = new Archive({
                                company: company,
                                departament: departament,
                                storehouse: storehouse,
                                volume: idVo,
                                doct: doct,
                                tag: Object.values(xlData[i]).slice(sizeSlice),
                                author: id,
                                mailSignup: sponsor,
                                sponsor: idOfSponsor,
                                sheetImport: sheet,
                                create: xlData[i][columnDataRetro] == undefined ? Date.now() : creaDate,
                                startDateCurrent: calculate.startDateCurrent,
                                finalDateCurrent: calculate.finalDateCurrent,
                                finalDateIntermediate: calculate.finalDateIntermediate,
                                finalFase: calculate.finalFase

                            });

                            const dataSend = {
                                volume: idVo,
                                doct: doct,
                                dintermediateValue: dintermediateValue,
                                dcurrentValue: dcurrentValue,
                                dfinal: dfinal,
                                indexTemporality: indexOfTemporality,
                                departament: departament,
                                company: company,
                                action: "CREATE",
                                archive: document._id

                            }
                            await document.save()

                                .then(await Volume.update({ _id: idVo.toString() }, { $set: { records: true } }))
                                .catch((e) => console.error(e))

                            if (flagStorehouse != true) {
                                sendQueuesVolumeRetention(dataSend)
                            }


                            vol.push(document)
                        }
                    }



                }
            }

            if (idMessage === null) {


                const newNotification = {
                    title: `SERÃO PROCESSADOS ${xlData.length - 1} REGISTROS.`,
                    msg: `AGUARDE.....`,
                    linkIcon: iconsuscess,
                    user: 'upload-' + id.toString(),
                    mailSignup: sponsor,
                    active: true,
                    importStatus: true,
                    dateCreated: Date.now()
                }
                db.ref('notifications').push(newNotification)
                    .on('value', function (snapshot) {
                        let idmsg = snapshot.key;
                        idMessage = idmsg

                    })

            }
            // status de importacao futuro
            let updateMssg = {
                title: `IMPORTACAO EM ANDAMENTO....FIQUE TRANQUILO`,
                msg: `LENDO A LINHA ${i}.`,
                linkIcon: iconsuscess,
                user: 'upload-' + id.toString(),
                mailSignup: sponsor,
                active: true,
                importStatus: true,
                dateCreated: Date.now()
            }
            db.ref('notifications/' + idMessage)
                .set(updateMssg)


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
            .catch((e) => console.error(e))

    } else {

        const documentError = new Sheetarchive({
            sheet: sheet,
            mailSignup: sponsor,
            logErrors: typeError
        })
        await documentError.save()

        const sheetErros = `${environment.urls.printErrorArchioves}/sheetarchives/excel/${documentError._id}`


        const newNotification = {
            title: "Importação de Arquivos com erros",
            msg: `Foram importados ${xlData.length - typeError.length} Arquivos com Suscesso, e não Importados ${typeError.length} Aquivos!`,
            linkIcon: iconerror,
            attachment: sheetErros,
            user: id,
            mailSignup: sponsor,
            active: true,
            dateCreated: Date.now()
        }
        db.ref('notifications').push(newNotification)
            .catch((e) => console.error(e))
        //   return true
    }

    typeError.push({})



    return true


















}


export { importArchives }

