
const fullDate = async (dateRead, dintermediateValue, dcurrentValue, dfinal) => {


    const date = dateRead.split("/")
    const year = Number(date[2])
    const mounth = Number(date[1])
    const day = Number(date[0])
    const startDateCurrent = new Date(year, mounth - 1, day)
    const finalDateCurrent = new Date(year + dcurrentValue, mounth - 1, day)
    const finalDateIntermediate = new Date(year + (dcurrentValue + dintermediateValue), mounth - 1, day)

    const data = {
        startDateCurrent: startDateCurrent,
        finalDateCurrent: finalDateCurrent,
        finalDateIntermediate: finalDateIntermediate,
        finalFase: dfinal,
        error: false,
        msg: "-"
    }
    return data


}


const competence = async (dateRead, dintermediateValue, dcurrentValue, dfinal) => {

    const date = dateRead.split("/")
    const year = Number(date[1])
    const mounth = Number(date[0]) - 1
    const startDateCurrent = new Date(year, mounth, 1)
    const finalDateCurrent = new Date(year + dcurrentValue, mounth, 1)
    const finalDateIntermediate = new Date(year + (dcurrentValue + dintermediateValue), mounth, 1)

    const data = {
        startDateCurrent: startDateCurrent,
        finalDateCurrent: finalDateCurrent,
        finalDateIntermediate: finalDateIntermediate,
        finalFase: dfinal,
        error: false,
        msg: "-"
    }
    return data


}

const year = async (dateRead, dintermediateValue, dcurrentValue, dfinal) => {

    let year = Number(dateRead)
    let mounth = Number(12)-1
    let day = Number(31)
    let startDateCurrent = new Date(year, mounth, day)

    let finalDateCurrent = new Date(year + dcurrentValue, mounth, day)

    let finalDateIntermediate = new Date(year + (dcurrentValue + dintermediateValue), mounth, day)

    const data = {
        startDateCurrent: startDateCurrent,
        finalDateCurrent: finalDateCurrent,
        finalDateIntermediate: finalDateIntermediate,
        finalFase: dfinal,
        error: false,
        msg: "-"
    }
    return data


}







export { fullDate, competence, year }