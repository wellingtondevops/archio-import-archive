
import { Volume } from './../volumes/volumes.model';
import * as restify from "restify";
import { ModelRouter } from "../common/model-router";
import { environment } from "../common/environment";
import { importArchives } from '../archives/archives';



const connectionAmqp = environment.ampqkluster
const amqp = require("amqplib/callback_api");

const queue = environment.queues.msImportArchives


export class Consumer extends ModelRouter<Volume> {
  constructor() {
    super(Volume);
  }

  applyRoutes(applycation: restify.Server) {


    amqp.connect(connectionAmqp, (error, connection) => {

      if (error)
        throw error;

      connection.createChannel(function (error, channel) {
        if (error)
          throw error;

        channel.prefetch(1);
        channel.assertQueue(queue, { durable: false });
        

        channel.consume(queue, async (msg) => {
          const data = (JSON.parse(msg.content.toString()))

          const process =await importArchives(data)
          
          if (process === true) {
            console.log("Waiting next mssg!!!!")
          } else {
            console.error("Ixe deu ruim")
          }
          setTimeout(function () {
            console.log("[x]...Done.....!!")
            channel.ack(msg)

          }, 2000)
        }, { noAck: false })
        //})
      },)
    })
  }
}

export const consumer = new Consumer();
