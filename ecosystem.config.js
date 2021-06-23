module.exports = {
  apps : [{
    name   : "earchive-api ",
    script : "./main.js",
    instances: 0,
    exec_mode: "cluster",
    watch: true,
    merge_logs: true,
    env: {
      SERVER_PORT: 3005,
      DB_URL: "mongodb://earchiveTester:cdh0tAYUFJXDMB3t@cluster0-shard-00-00-rr6sx.mongodb.net:27017/earchive?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin",  
      NODE_ENV: "production",
      AMQP_URL:"amqp://archio:archio@rabbitmq",
      PROJECT_ID:  "archionotifier",
      PRIVATE_KEY_ID:"146c40d8c5c677b737ee8bc4aebe20250141530a",
      PRIVATE_KEY : "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDT4035yGahEiaH\n6JjEyw/aul+fdXR3d4Sv+moJLRTrHvQQA8/r+g7NG7B6179ujYRwyPjD/sTrPB8U\n8Aizub4ew2jNPIEo/eU0RCqx3a7YAnZ6Jq4ly6FsJrA5hxlPtDlStarjMZl5m4Hi\nol1UYlVBvVXyFL4K4r4NuyPKTM3HfLQ7ElUUNbES06H+bkjSd4IkdSwmW/YeLjfj\neJ210/38CF9hsbsYwV/BlZqRlCn0roRVgYWf6q62PppGHsfk9N0M/iU8t0lWIKNX\nx8vT0q/2H0Kk0mzXpyFIpDs47lkS5AHrv1BtgBuzpViuwI0d77IVgEqhJ1m1PQrp\nUK4DNftDAgMBAAECggEAN9XwWGA82zkjOjFLAKDaHrN6O1UCSfEO4CjHBIACwSq4\n+fdnNTIB8H7ZdKWh5ooYWng7Rbq/PZXsQuI2CNZriUPJPDwzdQ/i9HD6J0DZsEaF\n3g6PWZpdgVh4m9BEFULS0D7bN198qBUYlxZeLbxz5wzztwVMRyYVGx0zgz3WBDkX\nYpEEcMjRdvLqrv+9Vv+P5jJFg7LAJWfqTh1IJmFXiO6oiLBuRFlNmZ0QvYBvKFuq\ngPxWwMwJcnpufTjI/aSmIkSOQxcq/ZyHaEptmy8crjVjz0ckGL8FyhRbD352TRag\nlozM75J2jhxHfzXPgTgHLghs7qhrfZVjznAixHe6sQKBgQD5mD1C7TE9QJULdjSg\nl/QFNJI+COe85PFLlFtZmfxuJwU+P7z+MGXCVEPGCJcduQdVtOTeWzWUI4Lhk00J\nkLBUWXqvo0DTYkVkcZ3UwuxfGVs9P5ZJVmxPeJgAnV7Fw0lb6NUEan/QmeIcZAZW\nXOXWvUhyM8P8Qmbyn7tVYFWf/wKBgQDZU1fjIrMv2Do8Qkg9A81LlCghSS3YKF44\ngDcsZXZpG/vYH02a1PmpqFYnRVjD4hPxhAUaVyLSrA2uNWyV4nWDh3K7ES9WP6QH\nPWq3GBBEoNk338BBCOB6VpzFD3ULaq//vBkd58tXofotRL+/Srmgb38pSaTLFRSC\nqaPLxoEkvQKBgQDA/F55zg5hbvsPJrGgbn1mPPTKdHZCDr8nkiljyXVt8kvSitPl\nsqQrsp3IlEHL4JH0Se8gomN2DFMZeZx6Rd6hCaKcBV2NVBGVjWfc525+RYvPesgI\nIoOSmwrkhsmNneat4wQ56uKy9xjmnMxtoFyyQh6u9qmV9f3FoY3mgJsUHwKBgFhX\n8eUqSO8NFfdC9nyfHAg6LOoDBnjVSB/ttv/8KttlfcYIS5LCOs9F1+fU39WZBIRs\nJ2riuwwq1tDXdNGlIiIaoH/852JHMpWi2MufI5XSURrOgSeuxRnWNZpBw1Glx+/M\ndeVbQaTY+osGZHANn1HhoS6Wej/3zMOk1CnVAtB9AoGAQzUvA0U3Yx3EbmD7zYZb\ng5e6FaG87P/8YDNSOwyWRmC5Nh757Hl43ewTFkoLXDwV7Ahi+DWyjP1pWOKHSAti\nusB/EG1LNydNspND9Yml6zmEVtkdRd+nA7eqh4LmykSUoMEBM1K0Xt/LtYZXQUvt\nGhrb7MmyMimuZYRTaysy754=\n-----END PRIVATE KEY-----\n",
      CLIENT_EMAIL: "firebase-adminsdk-cpecv@archionotifier.iam.gserviceaccount.com",
      CLIENT_ID: "114314086239299810145",
      AUTH_URI : "https://accounts.google.com/o/oauth2/auth",
      TOKEN_URI: "https://oauth2.googleapis.com/token",
      AUTH_PROVIDER_X509_CERT_URL: "https://www.googleapis.com/oauth2/v1/certs",
      CLIENT_X509_CERT_URL: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-cpecv%40archionotifier.iam.gserviceaccount.com",
      DATABASEURL:'https://archionotifier-default-rtdb.firebaseio.com/',
      ICONERROR:"https://storage.googleapis.com/archiobucket/ARCHIOFILES/icons/errors.png",
      ICONSUSCESS: "https://storage.googleapis.com/archiobucket/ARCHIOFILES/icons/sucess.png",      
      IMPORT_URL:"http://localhost:3005/archives/import"
      
    }
  },
  {
    name   : "receiv-api ",
    script : "./queues/receiver.js",
    
    watch: true,
    merge_logs: true,
    env: {
      
      NODE_ENV: "production"
      
    }
  }]
}

// @rch10D0cker