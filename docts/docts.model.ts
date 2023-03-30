import * as mongoose from 'mongoose'
import { Company } from '../companies/companies.model'


export interface LabelField extends mongoose.Document {
    timeControl: boolean
    name: string,
    typefield: string,
    uniq: boolean
}

export interface Doct extends mongoose.Document {
    company: mongoose.Types.ObjectId  | Company,
    destFinal: any
    dfinal: string
    dcurrentValue: number
    dintermediateValue: number
    
    name: string,    
    label: LabelField[]
    cron:boolean
    activePackage:boolean
    ocr:boolean
    signature:boolean
}

const labSchema = new mongoose.Schema({
    namefield: {
        type: String,
        required: true,
        trim: true
    },
    typeField: {
        type: String,
        enum: ['NUMERO', 'DATA', 'COMPETENCIA', 'TEXTO', 'TEMPORALIDADE'],
        required: true
    },
    uniq: {
        type: Boolean,
        default: false,
        required: true
    },
    timeControl:{
        type:Boolean,
        default:false
    },
 
    
})

const docSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    refTemplateId:{
        type:String,
        default:""
    },
    refStructureId:{
        type:String,
        default:""
    },    
    codTopic:{
        type:String,
        default:""
    },
    dcurrentLabel:{
        type:String,
        default:""
    },
    dcurrentValue:{
        type:Number,
        default:0
    },
    dintermediateLabel:{
        type:String,
        default:""
    },
    dintermediateValue:{
        type:Number,
        default:0
    },
    dfinal:{
        type:String,
        default:""
    },
    label: {
        type: [labSchema],
        required: false,

        default: []
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        indexes:true,
        ref: 'Company',
        required:true        
    },

    mailSignup: {
        type: String,
        required: false,
        trim: true
    },
    updateby: {
        
        mailUpdate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:false
        },
        dateUpdate:{
            type:Date,
            required:false
          
        }
    },
    currentControl:{
        type:Boolean,
        default:false
    },
    cron:
    {
        type: Boolean,
        default:false
    },
    ocr:{
        type:Boolean,
        default:false
    },
    signature:{
        type:Boolean,
     
    }

})


export const Doct = mongoose.model<Doct>('Doct', docSchema)