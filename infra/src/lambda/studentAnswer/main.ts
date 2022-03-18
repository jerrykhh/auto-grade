import listStudentAnswer from "./listStudentAnswer";
import uploadStudentAnswer from "./uploadStudentAnswer"
import saveStudentAnswer from "./saveStudentAnswer"
import {Grading} from "./interface"
import getStat from "./getStat";

type AppsyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        // Upload student Answer
        teacherId: string,
        classroomId: string,
        sheetId: string,
        file: {
            bucket: string,
            region: string,
            uri: string
        }
        // List Student Answer 
        questionId: string,
        limit: number,
        nextToken: string

        input: Array<Grading>
    }
}


exports.handler = async (event: AppsyncEvent) => {
    switch (event.info.fieldName) {
        case "uploadStudentAnswer":
            return await uploadStudentAnswer({
                classroomId: event.arguments.classroomId,
                sheetId: event.arguments.sheetId,
                file: event.arguments.file,
                teacherId: event.arguments.teacherId
            });
        case "listStudentAnswer":
            return await listStudentAnswer({
                questionId: event.arguments.questionId,
                limit: event.arguments.limit,
                nextToken: event.arguments.nextToken
            });
        case "saveStudentAnswer":
            return await saveStudentAnswer({
                input: event.arguments.input
            })
        case "getStat":
            return await getStat({
                classroomId: event.arguments.classroomId,
                sheetId: event.arguments.sheetId
            })

        default:
           return null;
    }
}