const routes = require('./routes/routes');
const cors = require('cors');
const axios = require('axios')

const dotenv = require('dotenv'); 
dotenv.config({ path: './.env' }); 

const port = 4000;

const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectId;
      
const app = express();
app.use(express.static("public"));  // статические файлы будут в папке public
app.use(express.json());        // подключаем автоматический парсинг json
app.use(cors());
    
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017/");
   
(async () => {
     try {
        await mongoClient.connect();
        app.locals.collection = mongoClient.db("verin").collection("users");
        getToken()
        app.listen(port);
    }catch(err) {
        return console.log(err);
    } 
})();
   
routes(app)
    
// прослушиваем прерывание работы программы (ctrl-c)
process.on("SIGINT", async() => {
       
    await mongoClient.close();
    await axios.delete(`https://yougile.com/api-v2/auth/keys/${process.env.YOUGILE__TOKEN}`)
    console.log("Приложение завершило работу");
    process.exit();
});

const getToken = async() => {
    const YouGileLogin = process.env.YOUGILE__LOGIN;
    const YouGilePassword = process.env.YOUGILE__PASSWORD;
    const YouGileNameCompany = process.env.YOUGILE__NAME__COMPANY;

    const reqCompany = await axios.post("https://yougile.com/api-v2/auth/companies", 
        {login: YouGileLogin, password: YouGilePassword, name: YouGileNameCompany})
    const YouGileIdCompany = reqCompany.data.content[0].id;

    // const {data} = await axios.post("https://yougile.com/api-v2/auth/keys/get", 
    //     {login: YouGileLogin, password: YouGilePassword, companyId: YouGileIdCompany})
    // console.log(data)
        
    // data.map(d => axios.delete(`https://yougile.com/api-v2/auth/keys/${d.key}`))

    const reqToken = await axios.post("https://yougile.com/api-v2/auth/keys", 
        {login: YouGileLogin, password: YouGilePassword, companyId: YouGileIdCompany})
    process.env.YOUGILE__TOKEN = reqToken.data.key;
}