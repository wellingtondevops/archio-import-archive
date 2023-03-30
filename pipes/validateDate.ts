
const validateDate = async (data) => {

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(data)) { // Verifica o formato dd/mm/aaaa
        var partes = data.split("/");
        var dia = parseInt(partes[0], 10);
        var mes = parseInt(partes[1], 10);
        var ano = parseInt(partes[2], 10);
        if (mes < 1 || mes > 12) return {
            error: true
        };
        if (dia < 1 || dia > 31) return {
            error: true
        };
        if ((mes == 4 || mes == 6 || mes == 9 || mes == 11) && dia == 31) return {
            error: true
        };
        if (mes == 2) {
            if (dia > 29) return {
                error: true
            };
            if (dia == 29 && (ano % 4 != 0 || (ano % 100 == 0 && ano % 400 != 0))) return {
                error: true
            };
        }
        return {
            error: false,
            format: "FULLDATE"
        };
    } else if (/^\d{1,2}\/\d{4}$/.test(data)) { // Verifica o formato mm/aaaa
        var partes = data.split("/");
        var mes = parseInt(partes[0], 10);
        var ano = parseInt(partes[1], 10);
        if (mes < 1 || mes > 12) return {
            error: true
        };
        return {
            error: false,
            format: "COMPETENCE"
        };
    } else if (/^\d{4}$/.test(data)) { // Verifica o formato aaaa
        return {
            error: false,
            format: "YEAR"
        };
    }
    return {
        error: true
    }; // Caso não esteja em um dos formatos validos
}


export { validateDate }
