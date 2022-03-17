import listStudentAnswerSheet from "./listStudentAnswerSheet";
import publishStudentAnswerSheet from "./publishStudentAnswerSheet"


type AppsyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        answerSheetId: string,
        limit: number,
        nextToken: string,

        // publish
        classroomId: string,
        teacherId: string
    }
}

exports.handler = async (event: AppsyncEvent) => {
    switch (event.info.fieldName) {
        case "listStudentAnswerSheet":
            return await listStudentAnswerSheet({
                answerSheetId: event.arguments.answerSheetId,
                limit: event.arguments.limit,
                nextToken: event.arguments.nextToken
            })
        case "publishStudentAnswerSheet":
            return await publishStudentAnswerSheet({
                answerSheetId: event.arguments.answerSheetId,
                classroomId: event.arguments.classroomId,
                teacherId: event.arguments.teacherId
            })
        default:
            return null;
 }
}