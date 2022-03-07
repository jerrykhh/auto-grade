import {DynamoDB} from 'aws-sdk'
import {PDFAnnotation} from './interface'

const dynamodb  = new DynamoDB({
    apiVersion: '2012-08-10',
    region: process.env.REGION
})

type GetAnswerSheetEvent = {
    classroomId: string,
    id: string,
}

const getAnswerSheet = async (event:GetAnswerSheetEvent) => {

    const params: DynamoDB.GetItemInput = {
        TableName: `${process.env.ANSWERSHEET_TABLE}`,
        Key: {
            id: {
                S: event.id
            },
            classroomId: {
                S: event.classroomId
            }
        }
    }

    try{
        const data = (await dynamodb.getItem(params).promise()).Item;
        if (data != null){
            let answerSheet = DynamoDB.Converter.unmarshall(data);
            let locates = [];
            for(const locate of data.locate as Array<PDFAnnotation>)
                locates.push(DynamoDB.Converter.unmarshall(locate as DynamoDB.AttributeMap))
            answerSheet.locate = locates
            return answerSheet
        }
            
    }catch(err){
        console.log(err);
    }

    return null
}

export default getAnswerSheet;