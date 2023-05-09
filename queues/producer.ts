import { environment } from "../common/environment"
import  * as amqp from 'amqplib';






const URL_CONNECT_RABBITMQL = environment.rabbitmql.urlRabbitmq



const producerMessage = async (data,queue) => {
    const QUEUE_NAME= queue
    connect()
    async function connect() {
  
      
      
      try {
  
        const connection = await amqp.connect(URL_CONNECT_RABBITMQL)
        const channel = await connection.createChannel()
        await channel.assertQueue(QUEUE_NAME, { durable: true })
        await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(data)),{persistent:true})
        console.log(`SEND QUEUE: ${QUEUE_NAME}`)
        await channel.close()
        await connection.close()
  
      } catch (error) {
  
  
        try {
  
          const connection = await amqp.connect(URL_CONNECT_RABBITMQL)
          const channel = await connection.createChannel()
          await channel.assertQueue(QUEUE_NAME, { durable: true })
          await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(data)),{persistent:true})
          console.log(`SEND QUEUE: ${QUEUE_NAME}`)
          await channel.close()
          await connection.close()
          
        } catch (error) {
          console.error(error)
  
        }
  
      }
  
    }
  
    
  };


  export{producerMessage}