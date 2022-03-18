const awsconfig = {
    // Auth: {
    //     // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    //     identityPoolId: 'us-east-1:3fd44728-a5e7-4e99-b4c0-a310813a55ab',

    //     // REQUIRED - Amazon Cognito Region
    //     region: 'us-east-1',

    //     // OPTIONAL - Amazon Cognito User Pool ID
    //     userPoolId: 'us-east-1_vqfVAE7pt',

    //     // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    //     userPoolWebClientId: '5g91flo15e7g6dapb3hu7s9gpf',
    // },
    // Storage: {
    //     AWSS3: {
    //         bucket: 'auto-grade-app-storage', //REQUIRED -  Amazon S3 bucket name
    //         region: 'us-east-1', //OPTIONAL -  Amazon service region
    //     }
    // },
    // "aws_appsync_graphqlEndpoint": "https://3ootdnnqm5g2jbk4y6o3hdftme.appsync-api.us-east-1.amazonaws.com/graphql",
    // "aws_appsync_region": "us-east-1",
    // "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
    // "aws_appsync_apiKey": "null",
    Auth: {
        // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
        identityPoolId: `${process.env.NEXT_PUBLIC_IDENTITYPOOLID}`,

        // REQUIRED - Amazon Cognito Region
        region: 'us-east-1',

        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: `us-east-1_vqfVAE7pt`,

        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolWebClientId: `${process.env.NEXT_PUBLIC_USERPOOLWEBCLIENTID}`,
    },
    Storage: {
        AWSS3: {
            bucket: `${process.env.NEXT_PUBLIC_AWS3_BUCKET}`, //REQUIRED -  Amazon S3 bucket name
            region: `${process.env.NEXT_PUBLIC_AWS3_REGION}`, //OPTIONAL -  Amazon service region
        }
    },
    "aws_appsync_graphqlEndpoint": `${process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQLENDPOINT}`,
    "aws_appsync_region": `${process.env.NEXT_PUBLIC_AWS_APPSYNC_REGION}`,
    "aws_appsync_authenticationType": `${process.env.NEXT_PUBLIC_AWS_APPSYNC_AUTHENTICATIONTYPE}`,
    "aws_appsync_apiKey": `${process.env.NEXT_PUBLIC_AWS_APPSYNC_APIKEY}`,
};

export default awsconfig;