import {DBFFile} from 'dbffile';
import fs from 'fs';

async function parse() {
    let dbf = await DBFFile.open('./Расписание 4-7 неделя (22-25).DBF',{encoding: 'IBM866'});
    let records = await dbf.readRecords();

    var shedule = {
        "weeksRange": "4-7",
        "schema": []
    };
    var gt = {} // group_ table
    var count = 0;
    var group = {};
    var groupFlag = false;

    var dateFlag = false;
    var day = {};
    var classes = {};
    var a = 0;

    for (let record of records){
        //поиск всех задействованных групп  
        groupFlag = false;
        for (let i in shedule['schema']){
           if (shedule['schema'][i]["group"] == record["GROUP"]) {groupFlag = true; break;}
        }

        if (!groupFlag) {
            group = {
                "group": record["GROUP"],
                "schema": []
            }
            shedule["schema"].push(group);
            gt[record["GROUP"]] = count;
            count++;
        }
    
        //дабавление уроков
        dateFlag = false;
        for (let i in shedule['schema'][gt[record["GROUP"]]]['schema']){
            if (shedule['schema'][gt[record["GROUP"]]]['schema'][i]["date"] == record["DATE"]) {dateFlag = true; break}
        }
        classes = {
            "lesson": record["LES"],
            "audience": record["AUD"],
            "lecturer": record["NAME"],
            "subject": record["SUBJECT"],
            "subjectType": record["SUBJ_TYPE"]}
        if (!dateFlag) {
            day = {
                "date": record["DATE"],
                "classes": [classes] 
            }
            shedule['schema'][gt[record["GROUP"]]]['schema'].push(day);
        }
        else{
            a = shedule['schema'][gt[record["GROUP"]]]['schema'].length
            shedule['schema'][gt[record["GROUP"]]]['schema'][a-1]['classes'].push(classes);
        }
    }
    
    //перевод дат во временную метку
    var d = ''
    for (let i in shedule['schema']){
        for (let j in shedule['schema'][i]['schema']){
            d = shedule['schema'][i]['schema'][j]['date'].split('-');
            d = new Date(d[2]+'-'+d[1]+'-'+d[0]).getTime();
            shedule['schema'][i]['schema'][j]['date'] = d;
        }
    }
    fs.writeFile('parsed.json', JSON.stringify(shedule), (err) =>{
        if (err) console.log('error');
    })
}

parse();