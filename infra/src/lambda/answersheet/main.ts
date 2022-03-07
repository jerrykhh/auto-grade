import getQuesiton from './getQuestion'
import getAnswerSheet from './getAnswerSheet'
import listAnswerSheet from './listAnswerSheet'
import removeAnswerSheet from './removeAnswerSheet'
import saveQuestion from './saveQuestion'
import { PDFAnnotation, UploadFile } from './interface'
import {Lambda} from 'aws-sdk'
import createAnswerSheet from './createAnswerSheet'

type AnswerSheetAppsyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        teacherId: string,
        classroomId: string,
        id: string,
        type: number,
        sheetId: string
        limit: number
        nextToken: string
        questions: [PDFAnnotation],
        name: string,
        file: UploadFile
    }
}



exports.handler = async (event:AnswerSheetAppsyncEvent) => {
    switch (event.info.fieldName) {
        case "getQuestion":
            return await getQuesiton({
                id: event.arguments.id,
                sheetId: event.arguments.sheetId,
                classroomId: event.arguments.classroomId
            });
        case "getAnswerSheet":
            return await getAnswerSheet({
                id: event.arguments.id,
                classroomId: event.arguments.classroomId
            });
        case "listAnswerSheet":
            return await listAnswerSheet({
                classroomId: event.arguments.classroomId,
                limit: event.arguments.limit,
                nextToken: event.arguments.nextToken
            });
        case "removeAnswerSheet":
            return await removeAnswerSheet({
                id: event.arguments.id,
                classroomId: event.arguments.classroomId
            });

        case "saveQuestion": 
            return await saveQuestion({
                classroomId: event.arguments.classroomId,
                answerSheetId: event.arguments.id,
                sampleAnswers: event.arguments.questions
            });

        case "createAnswerSheet":
            return await createAnswerSheet({
                classroomId: event.arguments.classroomId,
                teacherId: event.arguments.teacherId,
                name: event.arguments.name,
                type: event.arguments.type,
                file: event.arguments.file
            })
            
        default:
            return null
    }
}