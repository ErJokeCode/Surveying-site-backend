const axios = require('axios');
const dotenv = require('dotenv'); 
const XLSX = require('xlsx');
var fs = require('fs');
const multer = require('multer');
const { start } = require('repl');
dotenv.config({ path: './.env' }); 

const router = app => {    
    app.post("/api/users", async(req, res)=> {
        try{
            if(!req.body) return res.sendStatus(400);
                    
            const userName = req.body.name;
            const userPhone = req.body.phone;
            const userAddress = req.body.address;
            const comment = req.body.comment;
            const services = req.body.services ? req.body.services : "";

            if(userName == "" || userPhone == "") 
                return res.sendStatus(400);

            const time = getNowDateWithTime();

            const user = {name: userName, phone: userPhone, address: userAddress, time: time, comment: comment, services: services};
            
            const collection = req.app.locals.collection;
        
            await collection.insertOne(user);
            sendToYouGile(user)
            res.send(user);
        }
        catch(err){
            console.log(err);
            res.sendStatus(500);
        }
    });

    app.get("/api/services", async(req, res) => {
        try{
            const YouGielNameAdminColumn = process.env.YOUGILE__ADMIN__NAME__COLUMN;
            const YouGileAdminService = process.env.YOUGILE__ADMIN__SERVICE;

            const reqTask = await axios.get("https://yougile.com/api-v2/tasks", 
                { params : {title : YouGileAdminService} , headers: {"Authorization" : `Bearer ${process.env.YOUGILE__TOKEN}`} })
            const descrTask = reqTask.data.content[0].description;
            let start = descrTask.indexOf("<table");
            let end = descrTask.indexOf("</table>")+8;
            const table = descrTask.slice(start, end);
            const json = toObject(table)

            // let dataServices = []

            // for(const id of idServices){
            //     const reqService = await axios.get(`https://yougile.com/api-v2/tasks/${id}`, 
            //         { headers: {"Authorization" : `Bearer ${process.env.YOUGILE__TOKEN}`} })
            //     if(!reqService.data.deleted){
            //         try{
            //             const discr = reqService.data.description;
            //             let start = discr.indexOf("<table>");
            //             let end = discr.indexOf("</table>")+8;
            //             const table = discr.slice(start, end);
            //             const json = toObject(table)
            //             // const indexStartFileLink = discr.indexOf("href=")+6;
            //             // if(indexStartFileLink != 5){
            //             //     let i = indexStartFileLink;
            //             //     while (discr[i] != `"`){
            //             //         i = i + 1;
            //             //     }
    
            //             //     const fileLink = discr.slice(indexStartFileLink, i);
                            
            //             //     // let url = URL.createObjectURL(file.data)
            //             //     // console.log(url)
                            
                            
            //             //     // var workbook = XLSX.readFile(file.data);
            //             //     // console.log(workbook)
            //             //     // var sheet_name_list = workbook.SheetNames;
            //             //     // console.log(sheet_name_list);
            //             // }  
            //         } catch{
            //             console.log(err);
            //         }
            //         // const title = reqService.data.title;
            //         // let description = "";
            //         // let image = "";
            //         // try{
            //         //     description = reqService.data.description;

            //         //     const indexStartImageLink = reqService.data.description.indexOf("src=")+5;
            //         //     let i = indexStartImageLink;
            //         //     while (description[i] != `"`){
            //         //         i = i + 1;
            //         //     }
            //         //     image = description.slice(indexStartImageLink, i);
            //         // }catch{
                        
            //         // }
                    
            //         // dataServices.push({title, description, image})
            //     }
            // }
            res.json(json)
        }
        catch{
            console.log(err);
            res.sendStatus(500);
        }
    })
}

const getNowDateWithTime = () => {
    var date_time = new Date();
        let date = ("0" + date_time.getDate()).slice(-2);
        let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
        let year = date_time.getFullYear();
        let hours = date_time.getHours();
        let minutes = date_time.getMinutes();
        let time = year + "-" + month + "-" + date + " " + hours + ":" + minutes;
    return time;
}

const sendToYouGile = async(user) => {
    const YouGileNameColumn = process.env.YOUGILE__NAME__COLUMN;

    // const {data} = await axios.post("https://yougile.com/api-v2/auth/keys/get", 
    //     {login: YouGileLogin, password: YouGilePassword, companyId: YouGileIdCompany})
    // console.log(data)
        
    // data.map(d => axios.delete(`https://yougile.com/api-v2/auth/keys/${d.key}`))
    
    const reqColumn = await axios.get("https://yougile.com/api-v2/columns", 
        { params : {title : YouGileNameColumn} , headers: {"Authorization" : `Bearer ${process.env.YOUGILE__TOKEN}`} })
    const YouGileIdColumn = reqColumn.data.content[0].id;

    const reqAddTask = await axios.post("https://yougile.com/api-v2/tasks", 
        {
            title: user.name,
            columnId: YouGileIdColumn,
            description: `<b>Номер телефона:</b> ${user.phone} <br>
            <b>Адрес:</b> ${user.address} <br>
            <b>Выбранные услуги:</b>${user.services.map(el => `<br>${el}`)}<br>
            <b>Комментарий:</b> ${user.comment}<br>
            <b>Время заявки:</b> ${user.time}`
        }, { headers : {"Authorization" : `Bearer ${process.env.YOUGILE__TOKEN}`}})
}

function toObject(table) {
    let startTR = 0;
    let endTR = -1;
    let startTD = 0;
    let endTD = -1;
    let json = []
    let id = 0;

    while(table.indexOf("<tr>", endTR) != -1){
        let cnt = 0
        let title = ""
        let description = ""
        let price = ""
        let icon = ""
        startTR = table.indexOf("<tr>", endTR);
        endTR = table.indexOf("</tr>", startTR);
        while(table.indexOf("<td>", endTD) != -1 && table.indexOf("<td>", endTD) < endTR){
            startTD = table.indexOf("<td>", endTD);
            endTD = table.indexOf("</td>", startTD);

            if(cnt == 0){
                title = table.slice(startTD + 4, endTD);
                cnt = cnt + 1;
            }
            else if (cnt == 1){
                description = table.slice(startTD + 4, endTD);
                cnt = cnt + 1;
            }
            else if (cnt == 2) {
                price = table.slice(startTD + 4, endTD);
                cnt = cnt + 1;
            }
            else if (cnt == 3) {
                let iconStr = table.slice(startTD + 4, endTD);
                let startLink = iconStr.indexOf("href=")+6;
                let endLink = iconStr.lastIndexOf(`"`)
                icon = iconStr.slice(startLink, endLink)
                cnt = 0;
            }
        }
        id = id + 1;
        let item = {id, title, description, price, icon}
        json.push(item)
    }
    return json
  }

module.exports = router;