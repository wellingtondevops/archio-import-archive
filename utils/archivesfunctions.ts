
import { Position } from '../positions/positions.model'





async function  createVolumeMapTrue (departament,company,storehouse, volume, document,next){
    let volumeTypeError=[]
    let controlPos = await Position.find({ storehouse: storehouse, position: { $eq: volume } })
    let idPosition = controlPos.map(el => { return el._id }).toString()
    let checkPosition = controlPos.map(el => { return el.used }).toString()
  

    if (idPosition !== '') {
      if (JSON.parse(checkPosition) === false) {            
        await document.save()
        await Position.update({ _id: idPosition }, { $set: { used: true, company: company, departament: departament } })
          .catch(next)
      }else{
        volumeTypeError.push({loc:volume,erro:"VERIFIQUE A POSIÇÃO UTILIZADA CONFORME MAPA"})
      }
    }else{
      volumeTypeError.push({loc:volume,erro:"VERIFIQUE A POSIÇÃO NÃO ENCONTRADA NO MAPA OU ATUALIZE O MAPA"})
    }
  };


  export {createVolumeMapTrue}