const amqp = require('amqplib/callback_api')
const axios = require('axios')
import { environment } from '../common/environment'
const connectionAmqp = environment.urlamqp.amqpurl
const urlimport = environment.urImport.url




amqp.connect(connectionAmqp,(err,connection)=>{
    if(err){
        throw err;
    }
    console.log("conectado")
    connection.createChannel((err,channel)=>{
        if(err){
            throw err;
        }
        let queueName="archiveimport"
       
        channel.assertQueue(queueName,{
            durable:false
        })
        channel.consume(queueName, (msg)=>{
            
            
            let receive =JSON.parse(msg.content.toString())
            const {id,sponsor,company,doct,departament,storehouse,retroDate,sheet,dataSeet} = receive
                 
             axios({
                method: 'post',
                url: urlimport,
                timeout: (60000 * 60) *24, // Wait for 10 seconds                
                data: {
                  id: id,
                  sponsor: sponsor,                  
                  company:company,
                  doct:doct,
                  departament:departament,
                  storehouse:storehouse,                  
                  sheet:sheet,
                  retroDate:retroDate,
                  dataSeet:dataSeet
                }
              })
              .then( response => 
               console.log(response.data))
              .catch(error => console.error('timeout excedido'))             
              channel.ack(msg)              
            
        })
    })
})