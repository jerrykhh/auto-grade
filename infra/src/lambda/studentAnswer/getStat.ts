import { DynamoDB } from "aws-sdk";

const dynamodb = new DynamoDB({
    region: process.env.REGION,
    apiVersion: '2012-08-10'
})

type GetStatEvent = {
    classroomId: string
    sheetId: string
}

const SKIP_TCODES = ["studentid", "classroom", "name", "code"];

const getStat = async (event: GetStatEvent) => {

    try {
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

        const marshallData = (await dynamodb.getItem(params).promise()).Item;

        // let answerSheet = DynamoDB.Converter.unmarshall(data);
        // let locates = [];
        // for(const locate of data.locate as Array<PDFAnnotation>)
        //     locates.push(DynamoDB.Converter.unmarshall(locate as DynamoDB.AttributeMap))
        // answerSheet.locate = locates

        const data = DynamoDB.Converter.unmarshall(marshallData as DynamoDB.AttributeMap);
        const questions = [];
        for (const locate of data["locate"]) {
            if (!SKIP_TCODES.includes(locate["tcode"]))
                questions.push(locate)
        }

        const studenParams: DynamoDB.QueryInput = {
            TableName: `${process.env.LOCATESTUDENTANSWERSHEET_TABLE}`,
            KeyConditionExpression: "answerSheetId = :id",
            ExpressionAttributeValues: {
                ":id": {
                    S: event.sheetId
                }
            },
            Limit: 200
        }

        const marshall_students = await dynamodb.query(studenParams).promise();
        const students = [];

        for (const student of marshall_students.Items!){
            students.push( DynamoDB.Converter.unmarshall(student))
        }

        for(const student of students){

            let mark = 0.0;

            for(const question of questions){
                const answer_grade_params: DynamoDB.GetItemInput = {
                    TableName: `${process.env.STUDENTANSWER_TABLE}`,
                    Key: {
                        questionId: {
                            S: question["qid"]
                        },
                        studentId: {
                            S: student["studentId"]
                        }
                    }
                }
                const mashall_student_ans = await dynamodb.getItem(answer_grade_params).promise();
                const student_ans = DynamoDB.Converter.unmarshall(mashall_student_ans.Item as DynamoDB.AttributeMap);
                mark += Number(student_ans["grade"]);

            }

            delete student["answerSheetId"];
            delete student["locate"]

            student["grade"] = Math.round(mark * 10) / 10;
        }

        students.sort((a,b) => (a["grade"] > b["grade"]) ? 1: -1);

        return students;



    } catch (err) {
        console.log(err);
        return null;
    }

}

export default getStat