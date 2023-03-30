


const parseDateFullToComp= async (data) => {


const dateString = data
const date = new Date(dateString);
const day = date.getUTCDate();
const month = date.getUTCMonth() + 1;
const year = date.getUTCFullYear();
const formattedDate = `${month < 10 ? '0' : ''}${month}/${year}`;



return formattedDate

}

export {parseDateFullToComp}
