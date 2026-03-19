
/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/




const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb')
const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider')

const REGION = process.env.REGION || 'us-east-2'
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'Users-dev'
const USER_POOL_ID = process.env.AUTH_USERPOOLID || 'us-east-2_XKq4cKesI'

const dynamo = new DynamoDBClient({ region: REGION })
const cognito = new CognitoIdentityProviderClient({ region: REGION })

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});


/**********************
 * Example get method *
 **********************/

app.get('/users', async function(req, res) {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email query param required' });

  try {
    const result = await dynamo.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { userId: { S: email } },
    }));
    if (!result.Item) return res.status(404).json({ error: 'User not found' });
    const item = result.Item;
    res.json({
      userId:    item.userId?.S,
      email:     item.email?.S,
      fullName:  item.fullName?.S,
      role:      item.role?.S,
      createdAt: item.createdAt?.S,
    });
  } catch (err) {
    console.error('DynamoDB GetItem error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.get('/me/*', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

/****************************
* Example post method *
****************************/

app.post('/users', async function(req, res) {
  const { fullName, username, role } = req.body || {};

  if (!username) {
    return res.status(400).json({ error: 'username (email) is required' });
  }

  const item = {
    userId:    { S: username },
    email:     { S: username },
    fullName:  { S: fullName || '' },
    role:      { S: role || 'doctor' },
    createdAt: { S: new Date().toISOString() },
  };

  try {
    await dynamo.send(new PutItemCommand({ TableName: TABLE_NAME, Item: item }));

    // Add user to the correct Cognito group so role-based routing works on sign-in
    try {
      await cognito.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: role || 'doctor',
      }));
    } catch (cognitoErr) {
      // Non-fatal: group assignment failed but profile was saved
      console.warn('Cognito group assignment failed:', cognitoErr.message);
    }

    res.json({ success: true, userId: username });
  } catch (err) {
    console.error('DynamoDB PutItem error:', err);
    res.status(500).json({ error: 'Failed to save user profile' });
  }
});

app.post('/me/*', function(req, res) {
  // Add your code here
  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

/****************************
* Example put method *
****************************/

app.put('/users', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/me/*', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

/****************************
* Example delete method *
****************************/

app.delete('/users', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.delete('/me/*', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
