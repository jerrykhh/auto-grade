import createClassroom from './createClassroom';
import getClassroom from './getClassroom'
import listClassroom from './listClassroom'
import updateClassroom from './updateClassroom';
import {Classroom} from './interface'
import RemoveClassroom from './removeClassroom';
import { DynamoDB } from 'aws-sdk';
import updateStudent from './updateStudent';
import removeStudent from './removeStudent';

type AppsyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        id: string,
        teacherId: string,
        limit: number,
        nextToken: string
        classroom: Classroom
        student: DynamoDB.AttributeValueList
        studentId: string
    }
}


exports.handler = async (event: AppsyncEvent) => {
    switch (event.info.fieldName) {
        case await "getClassroom":
            return getClassroom({
                id: event.arguments.id,
                teacherId: event.arguments.teacherId
            });
        case "listClassrooms":
            return await listClassroom({
                teacherId: event.arguments.teacherId,
                limit: event.arguments.limit,
                nextToken: event.arguments.nextToken
            });
        case "createClassroom":
            return await createClassroom(event.arguments.classroom)
        case "updateClassroom":
            return await updateClassroom(event.arguments.classroom)
        case "removeClassroom":
            return await RemoveClassroom({
                id: event.arguments.id,
                teacherId: event.arguments.teacherId
            });

        case "uploadStudent":
            return await updateStudent({
                id: event.arguments.id,
                teacherId: event.arguments.teacherId,
                student: event.arguments.student
            });
        case "removeStudent":
            return await removeStudent({
                id: event.arguments.id,
                teacherId: event.arguments.teacherId,
                studentId: event.arguments.studentId
            })
        default:
            return null;
    }
}