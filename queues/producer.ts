import ampq = require('amqplib');
import { environment } from '../common/environment'
const connectionAmqp = environment.ampqkluster



const sendQueusCalculateItens = async (data) => {

    connect()
    async function connect() {
      const queue=environment.queues.mscalculateItensInVolume
      console.log(`Send message for queue==> ${queue}`)
      
  
      try {
  
        const connection = await ampq.connect(connectionAmqp)
        const channel = await connection.createChannel()
        await channel.assertQueue(queue)
        await channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)))
        await channel.close()
        await connection.close()
  
      } catch (error) {
        console.log("Error 1, ao enviar mssg retention volumes",error)
  
  
        try {
  
          const connection = await ampq.connect(connectionAmqp)
          const channel = await connection.createChannel()
          await channel.assertQueue(queue)
          await channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)))
          await channel.close()
          await connection.close()
          
        } catch (error) {
          console.log("Error 1, ao enviar mssg retention volumes",error)
  
        }
  
      }
  
    }
  
    
  };


const sendQueuesVolumeRetention = async (dataSend) => {
    connect()
    async function connect() {
      const queue=environment.queues.msVolumeRetentionDate
      console.log(`Send message for queue==> ${queue}`)

        try {

            const connection = await ampq.connect(connectionAmqp)
            const channel = await connection.createChannel()
            await channel.assertQueue(queue,{durable:false})
            await channel.sendToQueue(queue, Buffer.from(JSON.stringify(dataSend)))
            console.log("[x]..Send message for queue:", queue)
            await channel.close()
            await connection.close()

        } catch (error) {

            try {
                const connection = await ampq.connect(connectionAmqp)
                const channel = await connection.createChannel()
                await channel.assertQueue(queue,{durable:false})
                await channel.sendToQueue(queue, Buffer.from(JSON.stringify(dataSend)))
                console.log("[x]..Send message for queue:", queue)
                await channel.close()
                await connection.close()

            } catch (error) {
                console.error(error)


            }

        }

    }

    return true

};


export { sendQueuesVolumeRetention,sendQueusCalculateItens }