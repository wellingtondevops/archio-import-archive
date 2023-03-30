

export const environment = {


    server: { port: process.env.SERVER_PORT || 3005 },
    queues: {
        processOCR: process.env.PROCESS_OCR || "PROCESS-OCR",
        processSignature: process.env.PROCESS_SIGNATURE || "PROCESS-SIGNATURE",
        msVolumeRetentionDate: process.env.MS_VOLUME_RETENTION_DATE || "MS-VOLUME-RETENTION-DATE",
        msCalculateTemporalyt: process.env.MS_VOLUME_RETENTION_DATE || "MS-VOLUME-RETENTION-DATE",
        mscalculateTemporalityPerCompany: process.env.MS_CALCULATE_TEMPORALITY_PER_COMPANY || "MS-CALCULATE-TEMPORALITY-PER-COMPANY",
        mscalculateTemporalityArchives: process.env.MS_CALCULATE_TEMPOLALITY_ARCHIVES || "MS_CALCULATE_TEMPOLALITY_ARCHIVES",
        mscalculateItensInVolume: process.env.MS_CALCULATE_ITENS_IN_VOLUME || "MS_CALCULATE_ITENS_IN_VOLUME",
        msAddVolumesInDocumentsPerDate: process.env.ADD_VOLUMES_IN_DOCUMENTS_PER_DATE || "MS-ADD-VOLUMES-IN-DOCUMENTS-PER-DATE",
        msImportArchives: process.env.MS_IMPORT_ARCHVES || "MS-IMPORT-ARCHIVES"
    },
    ampqkluster: process.env.KULSTER_QUEUES || "amqps://xdcjhjem:K_71cgMgEGZh-Yr0yqWQg8sUAIFRAeoh@kebnekaise.lmq.cloudamqp.com/xdcjhjem",
    emailservice: {
        url: process.env.EMAIL_SERVICE || "https://apidev.archio.com.br/users"
    },
    db: {
        url: process.env.MONGO_ACESS || "mongodb://earchiveTester:cdh0tAYUFJXDMB3t@cluster0-shard-00-00-rr6sx.mongodb.net:27017/earchive?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin"
    },
    email: {
        
        sendgridkey: process.env.SEND_MAIL || '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',
        template: process.env.EMAIL_TMPL || 'Seja bem vindo ao Archio <strong>{0}</strong>!<br><br>Seu usuário para acesso é <strong>{1}</strong>, e sua senha : <strong>{2}</strong><br><br>O endereço de acesso é <strong>https://archio.com.br/login</strong><br><br><br><br>Atenciosamente,<br><br>Equipe Smartscan. ',
        forgot: process.env.EMAIL_TMPL || '<strong>Sua nova Senha é: {2}</strong>',

    },
    security:
    {
        saltRounds: process.env.SALT_ROUNDS || 10,
        apiSecret: process.env.API_SECRET || '4485445487-39112589-09898',
        enableHTTPS: process.env.ENABLE_HTTPS || false,
        certificate: process.env.CERTI_FILE || './security/keys/cert.pem',
        key: process.env.CERT_KEY_FILE || './security/keys/cert.pem',
        firebase: process.env.FIREBASE || './security/keys/archionotifier-firebase-adminsdk-cpecv-146c40d8c5.json'

    },
    log: {
        level: process.env.LOG_LEVEL || 'debug',
        name: 'archio-api-logger'
    },
    smtp: {
        host: "smtp.gmail.com",
        port: 587,
        user: "suporte@archio.com.br",
        pass: "@rchi0$up0rtPa$$"

    },

    firebase: {

        type: process.env.TYPE || "service_account",
        project_id: process.env.PROJECT_ID || "archionotifications",
        private_key_id: process.env.PRIVATE_KEY_ID || "030909cf5fe11e46d46bf6239c2bd893eaa88e70",
        private_key: process.env.PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCpNkwMI0a5Vvnq\n37odSyUigyVCRJqbudzCTXQ6Y5n0N1uxz4Aqg5PZmQsRd5zFwSOJNlaJYJyILmhC\nE/2WBDL/ml4IT807UqZyw5HXnL+mN64fFJ+obg77gnVZxwDFSYx5zGQ7l/Wnpa0F\ny0c60a39cI9sfgiyGJcOMYWeudWo1Cc6hYeicintJWH+1fIRZwIKH1bUJ54Fbio9\nXZMLAwI4NQNTINsAUm4bAezaZibsORVo7A7hqLlSdUh60XojyUSD8x8TdvKaUBx/\nsePDgMX40HIBhVUCM1bY8iLoTMEk8nJAm7IUdijFtMVVzJP5oGcyFsGbF2s7N1lc\nET+yGl3lAgMBAAECggEAH2PMsLW8kXZCj2Eod/WwMlpMx6HNYpUUkFDo/knqzeSV\nFIOvPXPCMiwTYw6i3QaKrpIPdJWhBBxDx/pIYRNvWH5M8lLHejlHWmPQQsS3wsBy\ngx6Cza55Bgw588kYagDOV+vkLi/u6MYxtjDzCkTKd4jxeklZGJy6LO5f4MWNjq9b\nTMC9N6IGf/bAVQlej6i+O7z0HryatwUNE66Jcs79hTQjKT+Uer983gwusaUn0F66\nVjG4AAbHwwk4nfT8zpjSziPblRTag++eQVo0JSh3SQySkf/GqQRWuzQ9+mg48j4L\nf9Endw1U68OMkm3CblJ8VWQh14HoCb+jxl/4fwL9UwKBgQDRqu+xKkltAV1BmQme\ndk3/5pfsJ4rKgzAYO9GyPALGHea40ZlApNZqDUptcH9FOzWcX01SEFQpL87o5jT3\nCBD2Lk26wzY5tQm2C3dONqZKLAOyWqWaKb/GH2FAuQUM8YVMMRgJTRGgvuOmfCTL\nlUcOtTC2T16wuIbg0BZbvW/JpwKBgQDOmsFU4IMnXTs6awFovGSS0lGhMn+hujzj\nnNbOfgcU9t0Xd2AK68R1upU2Po8uI2IxdMG4ONyK9Y6IneUx+VosQ+GOs9JvM19Z\nQzAj1cLGT0rzdgO2fbeNk3Fg5E10nsD+DicjvJWQJF72se9bvIF3Zu/aDRfMvhkK\nDNKJmcY1kwKBgDctU/z80uvz4vXjb2ubWLWSmsKUOWtIEP0fqPTN5DD9J33V8w3X\nE3I/Yynf5C51AYvQbMm+8FcSdNJH2wJzxfrzfpM60mdnZFHbPJ+BtEtqv+JNBq3G\ndOiP04kz58dbPCgr91ZjSNNTyRdELm7BLz0Io/QmeRXqydwaBvhHp0abAoGBAIB+\nANU/2HHH6wkW+cZgvJAPm9MMLBKyWCIbLgE4okDok3J/vMyt+v5ZL2mQGM5SFUS6\n36wqOQd3VtEimiOtd+ZlxUdSEQM1yQwj3DG9RSi+sdeewwphP6IeW/otovpvrYmT\n1cXFCKOf6yu0WDAOmdpfu7Y6RF4CsGHuvZX0fDBfAoGAHfS021b04jsJQncDwYyH\nR7s/el3KFQtE2ERf3c53AHi8bnZNMQU6frp/iN3vi+Tdyb4afXANfy9pYT0H+CMD\n/WMVwitip0VopSruNZG3wyfwLg/5POfgI+Qs/V8G8HZEfovglv98lRtf3EpvB6pF\n8E2DrvmHqTFHcm5jUqF0rLA=\n-----END PRIVATE KEY-----\n",
        client_email: process.env.CLIENT_EMAIL || "firebase-adminsdk-oyhui@archionotifications.iam.gserviceaccount.com",
        client_id: process.env.CLIENT_ID || "115986341073552907094",
        auth_uri: process.env.AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL || "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-oyhui%40archionotifications.iam.gserviceaccount.com",
        databaseURL: process.env.DATABASEURL || 'https://archionotifications-default-rtdb.firebaseio.com/'

    },
    icons: {
        iconerror: process.env.ICONERROR || "fa fa-exclamation-triangle fa-2x",
        iconsuscess: process.env.ICONSUSCESS || "fa fa-check-square fa-2x"
    }


}


