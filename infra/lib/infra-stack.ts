import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscription from 'aws-cdk-lib/aws-sns-subscriptions';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DynamoDB } from 'aws-sdk';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const userPool = new cognito.UserPool(this, "Autograde-app-userPool", {
      autoVerify: {
        email: true
      },
      selfSignUpEnabled: true,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true
      }
    });

    const userPoolClient = userPool.addClient('AppClient', {
      userPoolClientName: "app",
      generateSecret: false
    });

    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName
        }]
    });

    // cognito Output
    // output
    new cdk.CfnOutput(this, "CognitoRegion", {
      value: cdk.Stack.of(this).region
    })
    new cdk.CfnOutput(this, "CognitoIdentityId", {
      value: identityPool.ref
    })
    new cdk.CfnOutput(this, "CognitoUserPoolId", {
      value: userPool.userPoolId
    })
    new cdk.CfnOutput(this, "CognitoUserPoolClientId", {
      value: userPoolClient.userPoolClientId
    })

    // S3 Storage

    const appS3storage = new s3.Bucket(this, "AutoGradeStorageBucket", {
      bucketName: "auto-grade-app-storage",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [{
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(10)
      }],
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.DELETE,
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT
          ],
          allowedOrigins: [
            "http://localhost:3000"
          ],
        }
      ]
    });

    const identityPool2appS3dRole = new iam.Role(this, 'identityPool2appS3dRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": identityPool.ref
        }
      }, "sts:AssumeRoleWithWebIdentity")
    });

    identityPool2appS3dRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:GetObject",
        "s3:PutObject"
      ],
      resources: [
        `${appS3storage.bucketArn}/*`
      ]
    }));

    new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
      identityPoolId: identityPool.ref,
      roles: {
        'authenticated': identityPool2appS3dRole.roleArn,
        'unauthenticated': identityPool2appS3dRole.roleArn
      }
    });

    // Output
    new cdk.CfnOutput(this, "S3-bucketName", {
      value: appS3storage.bucketName
    })



    // graphql
    const graphqlAPI = new appsync.GraphqlApi(this, "API", {
      name: "auto-grade-graphql",
      schema: appsync.Schema.fromAsset("src/dynamodb/schema/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool,
            appIdClientRegex: userPoolClient.userPoolClientId
          }
        }
      }
    });

    // Output
    new cdk.CfnOutput(this, "aws_appsync_graphqlEndpoint", {
      value: graphqlAPI.graphqlUrl
    })

    const classroomDDB = new dynamodb.Table(this, "ClassroomTable", {
      tableName: "auto-grade-Classroom",
      partitionKey: {
        name: 'teacherId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      // billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      billingMode: dynamodb.BillingMode.PROVISIONED,
    });

    classroomDDB.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 3
    }).scaleOnUtilization({ targetUtilizationPercent: 85 })

    classroomDDB.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 2
    });

    graphqlAPI.addDynamoDbDataSource('ClassroomDataSource', classroomDDB)

    const classroomLambda = new lambda.Function(this, 'AppsyncClassroomHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('./src/lambda/classroom/'),
      environment: {
        REGION: cdk.Stack.of(this).region,
        CLASSROOM_TABLE: classroomDDB.tableName
      }
    });

    const classroomLambdaDS = graphqlAPI.addLambdaDataSource('lambdaClassroomDataSource', classroomLambda);
    classroomDDB.grantFullAccess(classroomLambda);
    classroomLambdaDS.createResolver({
      typeName: "Query",
      "fieldName": "getClassroom"
    });

    classroomLambdaDS.createResolver({
      typeName: "Query",
      "fieldName": "listClassrooms"
    })

    classroomLambdaDS.createResolver({
      typeName: "Mutation",
      "fieldName": "createClassroom"
    })

    classroomLambdaDS.createResolver({
      typeName: "Mutation",
      "fieldName": "updateClassroom"
    })

    classroomLambdaDS.createResolver({
      typeName: "Mutation",
      "fieldName": "removeClassroom"
    });

    classroomLambdaDS.createResolver({
      typeName: "Mutation",
      "fieldName": "uploadStudent"
    });


    // Answer Sheet

    const answerSheetDDB = new dynamodb.Table(this, "AnswersheetTable", {
      tableName: "auto-grade-AnswerSheet",
      partitionKey: {
        name: 'classroomId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      // billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
      billingMode: dynamodb.BillingMode.PROVISIONED,
    })

    answerSheetDDB.autoScaleReadCapacity({
      minCapacity: 2,
      maxCapacity: 4
    })

    answerSheetDDB.autoScaleWriteCapacity({
      minCapacity: 2,
      maxCapacity: 3
    });

    graphqlAPI.addDynamoDbDataSource('AnswerSheetDataSource', answerSheetDDB);

    // Child Func
    const prepareAnswerSheetChildFunc = new lambda.Function(this, "AnswerSheetPrepareChildFunc", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('./src/lambda/childFunc/prepareAnswerSheet', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
          ]
        }
      }),
      environment: {
        CLASSROOM_TABLE: classroomDDB.tableName,
        ANSWERSHEET_TABLE: answerSheetDDB.tableName
      },
      timeout: cdk.Duration.seconds(15)
    });

    appS3storage.grantReadWrite(prepareAnswerSheetChildFunc);
    answerSheetDDB.grantReadWriteData(prepareAnswerSheetChildFunc);
    classroomDDB.grantReadData(prepareAnswerSheetChildFunc);

    const initAnswerSheetChildFunc = new lambda.Function(this, "AnswerSheetInitChildFunc", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('./src/lambda/childFunc/initAnswerSheet', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
          ]
        }
      }),
      environment: {
        ANSWERSHEET_TABLE: answerSheetDDB.tableName,
        PREPARE_ANSWERSHEET_FUNC: prepareAnswerSheetChildFunc.functionArn
      },
      timeout: cdk.Duration.seconds(15)
    });

    appS3storage.grantReadWrite(initAnswerSheetChildFunc);
    prepareAnswerSheetChildFunc.grantInvoke(initAnswerSheetChildFunc);
    answerSheetDDB.grantReadWriteData(initAnswerSheetChildFunc)

    const createAnswerSheetChildFunc = new lambda.Function(this, "AnswerSheetCreateChildFunc", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('./src/lambda/childFunc/createAnswerSheet', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
          ]
        }
      }),
      environment: {
        ANSWERSHEET_TABLE: answerSheetDDB.tableName,
        INIT_ANSWERSHEET_FUNC: initAnswerSheetChildFunc.functionArn
      },
      timeout: cdk.Duration.seconds(15)
    });

    appS3storage.grantReadWrite(createAnswerSheetChildFunc);
    initAnswerSheetChildFunc.grantInvoke(createAnswerSheetChildFunc);
    answerSheetDDB.grantReadWriteData(createAnswerSheetChildFunc);

    // Answer sheet lambda
    const answerSheetLambda = new lambda.Function(this, 'AppsyncAnswerSheetHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('./src/lambda/answerSheet'),
      environment: {
        REGION: cdk.Stack.of(this).region,
        ANSWERSHEET_TABLE: answerSheetDDB.tableName,
        CREATE_ANSWERSHEET_ARN: createAnswerSheetChildFunc.functionArn
      },
    });
    createAnswerSheetChildFunc.grantInvoke(answerSheetLambda);

    const answerSheetLamdbaDS = graphqlAPI.addLambdaDataSource('lamdbaAnswerSheetDataSource', answerSheetLambda);
    answerSheetDDB.grantFullAccess(answerSheetLambda);

    answerSheetLamdbaDS.createResolver({
      typeName: "Query",
      fieldName: "getQuestion"
    });

    answerSheetLamdbaDS.createResolver({
      typeName: "Query",
      fieldName: "getAnswerSheet"
    });

    answerSheetLamdbaDS.createResolver({
      typeName: "Query",
      fieldName: "listAnswerSheet"
    })

    answerSheetLamdbaDS.createResolver({
      typeName: "Mutation",
      fieldName: "createAnswerSheet"
    })

    answerSheetLamdbaDS.createResolver({
      typeName: "Mutation",
      fieldName: "removeAnswerSheet"
    })

    answerSheetLamdbaDS.createResolver({
      typeName: "Mutation",
      fieldName: "saveQuestion"
    });

    appS3storage.grantRead(answerSheetLambda);

    // Student Answer

    const studentAnswerDDB = new dynamodb.Table(this, "StudentAnswerTable", {
      tableName: "auto-grade-StudentAnswer",
      partitionKey: {
        name: "questionId",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'studentId',
        type: dynamodb.AttributeType.STRING
      },
      readCapacity: 3,
      writeCapacity: 3,
      // billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      billingMode: dynamodb.BillingMode.PROVISIONED,
    });

    studentAnswerDDB.autoScaleReadCapacity({
      minCapacity: 3,
      maxCapacity: 8
    });

    studentAnswerDDB.autoScaleWriteCapacity({
      minCapacity: 3,
      maxCapacity: 8
    });
    
    graphqlAPI.addDynamoDbDataSource("StudentAnswerDataSource",studentAnswerDDB);


    // Locate Student Answer Sheet
    const locateStudentAnswerSheetDDB = new dynamodb.Table(this, "LocateStudentAnswer", {
      tableName: "auto-grade-LocateSheet",
      partitionKey: {
        name: 'answerSheetId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'studentId',
        type: dynamodb.AttributeType.STRING
      },
      // billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      billingMode: dynamodb.BillingMode.PROVISIONED,
    })

    locateStudentAnswerSheetDDB.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 3
    }).scaleOnUtilization({ targetUtilizationPercent: 85 })

    locateStudentAnswerSheetDDB.autoScaleWriteCapacity({
      minCapacity: 2,
      maxCapacity: 4
    });

    const studentAnswerSheetLambda = new lambda.Function(this, "StudentAnswerSheetLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('./src/lambda/studentAnswerSheet'),
      environment: {
        REGION: cdk.Stack.of(this).region,
        STUDENTANSWERSHEET_TABLE: locateStudentAnswerSheetDDB.tableName
      }
    });

    const studentAnswerSheetDS = graphqlAPI.addLambdaDataSource("lambdaStudentAnswerSheetDataSource", studentAnswerSheetLambda);
    locateStudentAnswerSheetDDB.grantReadData(studentAnswerSheetLambda);

    studentAnswerSheetDS.createResolver({
      typeName: "Query",
      fieldName: "listStudentAnswerSheet"
    })



    // SNS

    const textractServiceRole = new iam.Role(this, 'TextractServiceRole', {
      assumedBy: new iam.ServicePrincipal('textract.amazonaws.com')
    });

    const qrcodeDecoder = new lambda.Function(this, "QRCODE_DECODER", {
      handler: "main",
      runtime: lambda.Runtime.GO_1_X,
      code: lambda.Code.fromAsset("./src/lambda/childFunc/qrcodeDecode"),
      environment: {
        REGION: cdk.Stack.of(this).region,
        BUCKET: appS3storage.bucketName
      }
    })
    appS3storage.grantRead(qrcodeDecoder);

    const uploadStudentAnswerLambda = new lambda.Function(this, "SubscriptTextract", {
      handler: "main.handler",
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset("./src/lambda/childFunc/subscriptTextract",{
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
          ]
        },
      }),
      environment: {
        REGION: cdk.Stack.of(this).region,
        ANSWERSHEET_TABLE: answerSheetDDB.tableName,
        STUDENTANSWER_TABLE: studentAnswerDDB.tableName,
        QRCODE_DECODEER: qrcodeDecoder.functionArn,
        LOCATESTUDENTANSWERSHEET_TABLE: locateStudentAnswerSheetDDB.tableName
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
    });

    answerSheetDDB.grantReadWriteData(uploadStudentAnswerLambda);
    locateStudentAnswerSheetDDB.grantWriteData(uploadStudentAnswerLambda);
    qrcodeDecoder.grantInvoke(uploadStudentAnswerLambda)
    studentAnswerDDB.grantWriteData(uploadStudentAnswerLambda)
    appS3storage.grantReadWrite(uploadStudentAnswerLambda);


    studentAnswerDDB.grantReadWriteData(uploadStudentAnswerLambda);
    uploadStudentAnswerLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["textract:*"],
      resources: [`*`]
    }))

    const textDetectSNS = new sns.Topic(this, "AutoGradeTextractSNS", {
      topicName: "TextractMessage",
      fifo: false
    });

    textractServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [textDetectSNS.topicArn],
        actions: ["sns:Publish"]
      })
    );

    textDetectSNS.addSubscription(new subscription.LambdaSubscription(uploadStudentAnswerLambda));

    const startTextract = new lambda.Function(this, "AutoGradeStartTextract", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "main.handler",
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      code: lambda.Code.fromAsset("./src/lambda/childFunc/startTextract", {
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
          ]
        },
      }),

      environment: {
        TEXTRACTROLE: textractServiceRole.roleArn,
        SNSTOPIC: textDetectSNS.topicArn,
        ANSWERSHEET_TABLE: answerSheetDDB.tableName,
        REGION: cdk.Stack.of(this).region
      }
    })

    startTextract.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: [textractServiceRole.roleArn]
      })
    )

    startTextract.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["textract:*"],
      resources: [`*`]
    }));

    appS3storage.grantReadWrite(startTextract);
    answerSheetDDB.grantReadWriteData(startTextract);


    const studentAnswerLambda = new lambda.Function(this, "AutoGrade-StudentAnswerLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('./src/lambda/studentAnswer'),
      environment: {
        REGION: cdk.Stack.of(this).region,
        STUDENTANSWER_TABLE: studentAnswerDDB.tableName,
        ANSWERSHEET_TABLE: answerSheetDDB.tableName,
        STARTTEXTRACT: startTextract.functionArn
      }
    });

    answerSheetDDB.grantReadWriteData(studentAnswerLambda);
    startTextract.grantInvoke(studentAnswerLambda);



    const studentAnswerDS = graphqlAPI.addLambdaDataSource('lamdbaStudentAnswerDataSource', studentAnswerLambda);
    studentAnswerDDB.grantFullAccess(studentAnswerLambda);
    // appS3storage.grantReadWrite(studentAnswerLambda)

    studentAnswerDS.createResolver({
      typeName: "Mutation",
      fieldName: "uploadStudentAnswer"
    })

    studentAnswerDS.createResolver({
      typeName: "Query",
      fieldName: "listStudentAnswer"
    })

    studentAnswerDS.createResolver({
      typeName: "Mutation",
      fieldName: "saveStudentAnswer"
    })






    // example resource
    // const queue = new sqs.Queue(this, 'InfraQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
