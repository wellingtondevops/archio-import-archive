import { ModelRouter } from '../common/model-router'
import * as restify from 'restify'
import { User } from './users.model'
import { Company } from '../companies/companies.model'
import { NotFoundError, MethodNotAllowedError } from 'restify-errors';
import { authenticate } from '../security/auth.handler';
import { authorize } from '../security/authz.handler'
import { environment } from '../common/environment'
import sgMail = require("@sendgrid/mail");

import { Guid } from "guid-typescript";
import { Doct } from '../docts/docts.model'
import { model } from 'mongoose';
import * as bcrypt from 'bcrypt'
import * as mongoose from 'mongoose'
import { Profile } from '../profiles/profiles.model'
import { JsonWebTokenError } from 'jsonwebtoken';

const axios = require('axios');
class UserRouter extends ModelRouter<User> {
  constructor() {
    super(User)
    this.on('beforeRender', document => {
      document.password = undefined
    })
  }
  findByEmail = (req, resp, next) => {
    if (req.query.email) {
      User.findByEmail(req.query.email.toLowerCase().trim())
        .then(user => {
          if (user) {
            return [user]
          } else {
            return []
          }
        })
        .then(this.renderAll(resp, next))
        .catch(next)
    } else {
      next()
    }
  }

  find = async (req, resp, next) => {

    let user = await User.find({ _id: req.authenticated._id })
      .select("permissions.company");
    let data2 = user[0].permissions.map(item => {
      return item.company;
    });
    let company = data2;
    
    let page = parseInt(req.query._page || 1)
    page += 1
    const skip = (page - 1) * this.pageSize




    let pr = await Profile.find({ "_id": mongoose.Types.ObjectId(req.authenticated.profile) })
    let extern = pr.map(el => { return el.profileExternal }).toString()
    let isExternal = JSON.parse(extern)

    if (isExternal === true) {

      User
        .count(User.find({
          mailSignup: req.authenticated.mailSignup, isSponser: false, externalUser: true, "permissions.company": company
        })).exec()
        .then(count => User.find({
          mailSignup: req.authenticated.mailSignup, isSponser: false, externalUser: true, "permissions.company": company
        })
          .skip(skip)
          .limit(this.pageSize)
          .then(this.renderAll(resp, next, {
            page, count, pageSize: this.pageSize, url: req.url
          })))
        .catch(next)
    } else {

      User
        .count(User.find({
          mailSignup: req.authenticated.mailSignup, isSponser: false, physicalDocuments:false
        })).exec()
        .then(count => User.find({
          mailSignup: req.authenticated.mailSignup, isSponser: false, physicalDocuments:false
        })
          .skip(skip)
          .limit(this.pageSize)
          .then(this.renderAll(resp, next, {
            page, count, pageSize: this.pageSize, url: req.url
          })))
        .catch(next)
    }







  }

  findname = (req, resp, next) => {
    if (req.query.name) {
      const recebe = req.query.name
      const regex = new RegExp(recebe)
      User.find({ name: regex })
        .then(this.renderAll(resp, next))
        .catch(next)
    } else {
      next()
    }
  }

  save = async (req, resp, next) => {
    const pass = Guid.raw().substring(0, 15)

    let pr = await Profile.find({ "_id": mongoose.Types.ObjectId(req.body.profiles) })
    let profileName = pr.map(el => { return el.profileName })
    let profileExternal = pr.map(el => { return el.profileExternal }).toString()

    // console.log("tipo do perfil", JSON.parse(profileExternal))

    let creator = req.authenticated._id.toString()


    let requester = false
    if (profileName.toString()==="DAENERYS"){
     requester= true
    }


    let document = new this.model({
      name: req.body.name,
      email: req.body.email.toLowerCase().trim(),
      password: pass,
      profile: mongoose.Types.ObjectId(req.body.profiles), // recebe id do profile
      profiles: profileName, // recebe pr.profileName
      externalUser: JSON.parse(profileExternal), //recebe booleando pr.externalUser 
      createBy: req.authenticated.email,
      creator: mongoose.Types.ObjectId(creator),
      isRequester:requester,
      isSponser: false,
      physicalDocuments:req.body.physicalDocuments,
      permissions: req.body.permissions,
      mailSignup: req.authenticated.mailSignup

    })

    User.find({ mailSignup: req.authenticated.mailSignup, name: req.body.name })
      .then(async (com) => {
        if (com.length === 0) {
          await axios.post('https://apidev.archio.com.br/users', {
        name: req.body.name,
        email: req.body.email.toLowerCase().trim(),
        subject:"Bem Vindo ao Archio",
        text: `Seja bem vindo ao Archio <strong>${req.body.name}</strong>!<br><br>Seu usuário para acesso é <strong>${req.body.email.toLowerCase().trim()}</strong>, e sua senha : <strong>${pass}</strong><br><br>O endereço de acesso é <strong>https://archio.com.br/login</strong><br><br><br><br><strong>Atenciosamente,</strong><br><br><img src="https://storage.googleapis.com/archiobucket/ARCHIOFILES/PNG-05.png"width="220" height="80"  />.`      })
          document.save()
            .then(this.render(resp, next))

        } else {
          throw new MethodNotAllowedError('🛠 Usuário já Cadastrado !')
        }


      }).catch(next)
  }

  signup = async (req, resp, next) => {
    const pass = Guid.raw().substring(0, 15)
    let document = new this.model({
      name: req.body.name,
      cnpj: req.body.cnpj,
      cpf: req.body.cpf,
      fone: req.body.fone,
      email:req.body.email.toLowerCase().trim(),
      password: pass,
      profiles: 'DAENERYS',
      physicalDocuments:req.body.physicalDocuments,
      isSponser: true,
      mailSignup: req.body.email.toLowerCase().trim()
    })
    // sgMail.setApiKey(environment.email.sendgridkey)
    // EmailService(req.body.email, 'Bem Vindo ao Archio!', environment.email.template
    //   .replace('{0}', req.body.name)
    //   .replace('{1}', req.body.email.toLowerCase().trim())
    //   .replace('{2}', pass))
    // 'Seja bem vindo ao Archio <strong>{0}</strong>!<br><br>Seu usuário para acesso é <strong>{1}</strong>, e sua senha : <strong>{2}</strong><br><br>O endereço de acesso é <strong>https://archio.com.br/login</strong><br><br><br><br>Atenciosamente,<br><br>Equipe Smartscan.
    await axios.post('https://apidev.archio.com.br/users', {
      name: req.body.name,
      email: req.body.email.toLowerCase().trim(),
      subject:"Bem Vindo ao Archio",
      text: `Seja bem vindo ao Archio <strong>${req.body.name}</strong>!<br><br>Seu usuário para acesso é <strong>${req.body.email.toLowerCase().trim()}</strong>, e sua senha : <strong>${pass}</strong><br><br>O endereço de acesso é <strong>https://archio.com.br/login</strong><br><br><br><br>Atenciosamente,<br><br>Equipe Smartscan.`
    })
  
    document.save()
      .then(this.render(resp, next))
      .catch(next)
      
  }
  findById = (req, resp, next) => {
    this.prepareOne(this.model.findById(req.params.id))
      .populate("permissions.company", "name")
      .populate("profile", "profileName profilePlaceHolder write read change")   
      .then(this.render(resp, next))
      .catch(next)
  }
  filter = async (req, resp, next) => {

    let user = await User.find({ _id: req.authenticated._id })
      .select("permissions.company");
    let data2 = user[0].permissions.map(item => {
      return item.company;
    });
    let company = data2;

    const recebe = req.body.name || ""
    const regex = new RegExp(recebe, 'i')
    const remail = req.body.email|| ""
    const regexmail = new RegExp(remail, 'i')


    let page = parseInt(req.query._page || 1)
    page += 1
    const skip = (page - 1) * this.pageSize

    let pr = await Profile.find({ "_id": mongoose.Types.ObjectId(req.authenticated.profile) })
    let extern = pr.map(el => { return el.profileExternal }).toString()
    let isExternal = JSON.parse(extern)

    if (isExternal === true) {
      User

        .count(User.find({
          mailSignup: req.authenticated.mailSignup, name: regex, email: regexmail, isSponser: false, externalUser: true, "permissions.company": company,
        })).exec()
        .then(count => User.find({
          mailSignup: req.authenticated.mailSignup, name: regex, email: regexmail, isSponser: false, externalUser: true, "permissions.company": company
        }).select('name  fone email dateCreated')
          .sort(User.name)
          .skip(skip)
          .limit(this.pageSize)
          .then(this.renderAll(resp, next, {
            page, count, pageSize: this.pageSize, url: req.url
          })))
        .catch(next)

    } else {
      User

        .count(User.find({
          mailSignup: req.authenticated.mailSignup, name: regex, email: regexmail, isSponser: false,isRequester:false
        })).exec()
        .then(count => User.find({
          mailSignup: req.authenticated.mailSignup, name: regex, email: regexmail, isSponser: false,isRequester:false
        }).select('name  fone email dateCreated')
          .sort(User.name)
          .skip(skip)
          .limit(this.pageSize)
          .then(this.renderAll(resp, next, {
            page, count, pageSize: this.pageSize, url: req.url
          })))
        .catch(next)

    }


  }

  findIdPermissions = async (req, resp, next) => {
    try {
      let user = await User.find({ _id: req.params.id })
        .select("permissions")
        .populate("permissions.docts", "name")
        .populate("permissions.company", "name")
      let docts = user[0].permissions
      resp.send(docts)
    } catch (error) {
    }
  }
  forgotPassword = async (req, resp, next) => {
    const pass = Guid.raw().substring(0, 15)
    
      const testPass = pass
      const saltRounds = 10
      const salt = bcrypt.genSaltSync(saltRounds)
      const hash = bcrypt.hashSync(testPass, salt)
      console.log(req.query.email.toLowerCase().trim())
      let user = await User.find({ email: req.query.email.toLowerCase().trim() })
      if (user.length > 0) {
        await User.update({ email: req.query.email.toLowerCase().trim() }, { password: hash })
        // sgMail.setApiKey(environment.email.sendgridkey)
        // EmailService(req.query.email.toLowerCase().trim(), 'ARCHIO INFORMA SUA NOVA SENHA', environment.email.forgot
        //   .replace('{2}', pass))
       await axios.post('https://apidev.archio.com.br/users', {
          name: '',
          email: req.query.email,
          subject:"TROCA DE SENHA ARCHIO",
          text: `Olá! Recebemos uma solicitação de nova senha.<br><br>Atualizamos sua senha para: <strong>${pass}</strong> . Vai precisar dela para fazer seu login, mas recomendamos que altere esta senha após o acesso.<br><br><br><br><strong>Atenciosamente,</strong><br><br><img src="https://storage.googleapis.com/archiobucket/ARCHIOFILES/PNG-05.png"width="220" height="80"  />.`
        })
        .then(function (response) {
          
        })
        .catch(function (error) {
          console.log(error);
        })

        resp.send(`Foi enviado para o email ${req.query.email.toLowerCase().trim()} uma nova Senha!`)
      } else {
        return next(new NotFoundError(`Email ${req.query.email.toLowerCase().trim()} não localizado!`))
        // resp.send(`Email ${req.query.email.toLowerCase().trim()} não localizado!`)

      }

  }

  requester = async (req, resp, next) => {

    let prof = await Profile.find({mailSignup:req.authenticated.mailSignup,profileName:"WESTEROS"})
    let pp = prof.map(el=>{return el._id}).toString()

    // let pr = await Profile.find({ "_id": mongoose.Types.ObjectId(req.body.profiles) })
    let profileName = prof.map(el => { return el.profileName })
    let profileExternal = prof.map(el => { return el.profileExternal }).toString()

    let creator = req.authenticated._id.toString()

    let document = new this.model({
      name: req.body.name,
      email: req.body.email.toLowerCase().trim(),
      fone: req.body.fone,
      profile: mongoose.Types.ObjectId(pp), // recebe id do profile
      profiles: profileName, // recebe pr.profileName
      externalUser: JSON.parse(profileExternal), //recebe booleando pr.externalUser
      isRequester:true,
      createBy: req.authenticated.email,
      creator: mongoose.Types.ObjectId(creator),
      isSponser: false,
      permissions: req.body.permissions,
      mailSignup: req.authenticated.mailSignup,
      print: false,
      download:false,
      physicalDocuments:true // só para diferenciar dos users normai

    })

    User.find({ mailSignup: req.authenticated.mailSignup, email: req.body.email })
      .then(async (com) => {
        if (com.length === 0) {
          document.save()
            .then(this.render(resp, next))
            
        } else {
          throw new MethodNotAllowedError('Solicitante já Cadastrado!')
        }
      }).catch(next)
  }

  filterRequesters = (req, resp, next) => {

    const recebe = req.body.name || ""
    const regex = new RegExp(recebe, 'i')
    const remail = req.body.email || ""
    const regexmail = new RegExp(remail, 'i')


    let page = parseInt(req.query._page || 1)
    page += 1
    const skip = (page - 1) * this.pageSize
    User

      .count(User.find({
        mailSignup: req.authenticated.mailSignup, "permissions.company":req.body.company ,name: regex, email: regexmail, isSponser: false, physicalDocuments:true
      })).exec()
      .then(count => User.find({
        mailSignup: req.authenticated.mailSignup,"permissions.company":req.body.company,name: regex, email: regexmail, isSponser: false, physicalDocuments:true
      }).select('name  fone email dateCreated')
        .populate("permissions.company", "name")
        .sort(User.name)
        .skip(skip)
        .limit(this.pageSize)
        .then(this.renderAll(resp, next, {
          page, count, pageSize: this.pageSize, url: req.url
        })))
      .catch(next)
  }


  findRequesters = async (req, resp, next) => {

    let page = parseInt(req.query._page || 1)
    page += 1
    const skip = (page - 1) * this.pageSize

      User
        .count(User.find({
          mailSignup: req.authenticated.mailSignup, isSponser: false, physicalDocuments:true 
        })).exec()
        .then(count => User.find({
          mailSignup: req.authenticated.mailSignup, isSponser: false, physicalDocuments:true 
        })
          .select('name  fone email dateCreated')
          .populate("permissions.company", "name")
          .skip(skip)
          .limit(this.pageSize)
          .then(this.renderAll(resp, next, {
            page, count, pageSize: this.pageSize, url: req.url
          })))
        .catch(next)
    }







  

  updateUser = async (req, resp, next) => {


    const options = { runValidators: true, new: true }
    this.model.findByIdAndUpdate(req.params.id, req.body, options)
      .then(this.render(resp, next))
    var pr = await Profile.find({ "_id": mongoose.Types.ObjectId(req.body.profile||req.authenticated.profile) })

    var profileName = pr.map(el => { return el.profileName })
    var profileExternal = pr.map(el => { return el.profileExternal }).toString()
    
    await User.update({ _id: req.params.id }, {

      $set:
      {
        profiles: profileName, // recebe pr.profileName
        externalUser: JSON.parse(profileExternal), //recebe booleando pr.externalUser
      }
    }
    ).catch(next)

    console.log()
  }

  updateRequester = async (req, resp, next) => {

    
    try {
      const options = { runValidators: true, new: true }
      this.model.findByIdAndUpdate(req.params.id, req.body, options)
        .then(this.render(resp, next))
      var pr = await Profile.find({ "_id": mongoose.Types.ObjectId(req.params.id) })
  
      var profileName = pr.map(el => { return el.profileName })
      var profileExternal = pr.map(el => { return el.profileExternal }).toString()
      
      await User.update({ _id: req.params.id }, {
  
        $set:
        {
          profiles: profileName, // recebe pr.profileName
          externalUser: JSON.parse(profileExternal), //recebe booleando pr.externalUser
        }
      }
      ).catch(next)
    
    } catch (e) {
      console.log(e)
    
    }


    
  }

  findByIdReq = (req, resp, next) => {
    this.prepareOne(this.model.findById(req.params.id))
      
      .populate("permissions.company", "name")
      .then(this.render(resp, next))
      .catch(next)
  }


  applyRoutes(applycation: restify.Server) {
    applycation.get(`${this.basePath}/Forgotpassword`, this.forgotPassword)
    applycation.post(`${this.basePath}/search`, [this.filter])
    applycation.get({ path: `${this.basePath}`, version: '2.0.0' }, [this.find])
    applycation.get(`${this.basePath}/:id`, [this.validateId, this.findById])
    applycation.get(`${this.basePath}/requesters/:id`, [this.validateId, this.findByIdReq])
    applycation.post(`${this.basePath}/requesters`, [authorize('DAENERYS'), this.requester])
    applycation.get({ path: `${this.basePath}/requesters`, version: '2.0.0' }, [this.findRequesters])
    applycation.post(`${this.basePath}/requesters/search`, [authorize('DAENERYS'), this.filterRequesters])
    applycation.del(`${this.basePath}requesters/:id`, [this.validateId, this.delete])
    applycation.get(`${this.basePath}/permissions/:id`, [this.validateId, this.findIdPermissions])
    applycation.post(`${this.basePath}`, [authorize('DAENERYS', 'STARK'), this.save])
    applycation.put(`${this.basePath}/:id`, [this.validateId, this.replace])
    applycation.patch(`${this.basePath}/:id`, [this.validateId, this.updateUser])
    applycation.patch(`${this.basePath}/requesters/:id`, [this.validateId, this.updateRequester])
    applycation.del(`${this.basePath}/:id`, [authorize('DAENERYS'), this.validateId, this.delete])
    applycation.post(`${this.basePath}/authenticate`, authenticate)
    applycation.post(`${this.basePath}/Signup`, this.signup)
  }
}
export const usersRouter = new UserRouter()