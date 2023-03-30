import { competence, fullDate, year } from "./datesCalc"

const calcTemporality = async (dataType, date, dintermediateValue, dcurrentValue, dfinal) => {
    if (dataType.error === true) {
        
        const data = {
            startDateCurrent: undefined,
            finalDateCurrent: undefined,
            finalDateIntermediate: undefined,
            finalFase: dfinal,
            error: true,
            msg: `Invalide Date ..> ${date}`
        }

        return data

    } else if (dataType.format === "YEAR") {

        return year(date, dintermediateValue, dcurrentValue, dfinal)

    } else if (dataType.format === "COMPETENCE") {

        return competence(date, dintermediateValue, dcurrentValue, dfinal)

    } else if (dataType.format === "FULLDATE") {

        return fullDate(date, dintermediateValue, dcurrentValue, dfinal)
    }






}

export { calcTemporality }