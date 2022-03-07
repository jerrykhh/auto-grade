import { DynamoDB } from "aws-sdk";

export const dynamodb: DynamoDB = new DynamoDB({
    region: process.env.REGION,
    apiVersion: '2012-08-10'
})
