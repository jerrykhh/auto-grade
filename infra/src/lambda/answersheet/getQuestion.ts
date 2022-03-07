import {DynamoDB} from 'aws-sdk'
import {PDFAnnotation} from './interface'

const dynamodb  = new DynamoDB({
    apiVersion: '2012-08-10',
    region: process.env.REGION
})

type GetQuestionEvent = {
    classroomId: string,
    sheetId: string,
    id: string
}

const getQuesiton = async (event:GetQuestionEvent) => {

    const params: DynamoDB.GetItemInput = {
        TableName: `${process.env.ANSWERSHEET_TABLE}`,
        Key: {
            id: {
                S: event.sheetId
            },
            classroomId: {
                S: event.classroomId
            }
        }
    }

    try{
        const data = (await dynamodb.getItem(params).promise()).Item;
        if (data != null){
            const covertedData = DynamoDB.Converter.unmarshall(data);
            const resultIndex = covertedData.locate.findIndex( (obj: PDFAnnotation) => obj.id === event.id);
            if (resultIndex < 0)
                return null
            return covertedData.locate[resultIndex];
        }
    }catch(err){
        console.log(err);
    }

    return null
}

export default getQuesiton;