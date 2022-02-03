import { DBFFile } from 'dbffile';
import fs from 'fs';
import path from 'path'

const getDBFFile = () => {
    const pathToDBF = path.join(path.resolve(), '/uploads/')
    const listDBF = fs.readdirSync(pathToDBF).shift() // get the first file
    return path.join(pathToDBF, listDBF)
}

const getPathToDist = () => path.join(path.resolve(), '/dist/')

const makeClassesShema = ({ LES, AUD, NAME, SUBJECT, SUBJ_TYPE }) => {
    return {
        lesson: LES,
        audience: AUD,
        lecturer: NAME,
        subject: SUBJECT,
        subjectType : SUBJ_TYPE
    }
}

const parseDate = isoDate => {
    const dt = new Date(isoDate.split('-').reverse().join('-'))
    return dt.getTime()
}

const getRowFromDBF = async () => {
    const dbf = await DBFFile.open(getDBFFile(), { encoding: 'IBM866' })
    const result = await dbf.readRecords()
    return result
}

const getGroupID = (nodeGroupList, childGroupList) => {
    const tmp = childGroupList || []
    nodeGroupList.map(element => tmp.indexOf(element.GROUP) === -1 ? tmp.push(element.GROUP) : false)
    return tmp
}



const makeDBFToJSON = async () => {

    const schedule = []

    const dbfData = await getRowFromDBF()

    const groupsId = getGroupID(dbfData)

    for (const gid in groupsId ) {
        schedule.push({group: groupsId[gid], schema: []})
        for (let indexDBF = 0; indexDBF < dbfData.length; indexDBF++) {
            if ( schedule[gid].group === dbfData[indexDBF].GROUP ) {
                const date = parseDate(dbfData[indexDBF].DATE)
                const schema = makeClassesShema(dbfData[indexDBF])
                if ( schedule[gid].schema.length === 0 ) {
                    schedule[gid].schema.push({
                        date: date,
                        classes: [schema]
                    })
                } else {
                    for (const sch in schedule[gid].schema) {
                        if ( schedule[gid].schema[sch].date === date ) {
                            schedule[gid].schema[sch].classes.push(schema)
                        } else {
                            schedule[gid].schema.push({
                                date: date,
                                classes: [schema]
                            })
                            break;
                        }
                    }
                }
            }
        }
    }

    return {
        groupsId,
        schedule
    }

}

makeDBFToJSON()
    .then(res => {
        try {
            fs.writeFileSync(path.join(getPathToDist(), 'schema.json'), JSON.stringify(res))
            console.log('Success')
        } catch (err) {
            console.log('Error', err.msg)
        }
    })

