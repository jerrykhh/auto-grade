import listStudentAnswerSheet from "./listStudentAnswerSheet";



type AppsyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        answerSheetId: string,
        limit: number,
        nextToken: string
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
        default:
            return null;
 }
}