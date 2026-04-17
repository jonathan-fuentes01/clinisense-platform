
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
const { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, TransactWriteItemsCommand, ScanCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb')
const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider')

const REGION = process.env.REGION || 'us-east-2'
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'Users-dev'
const HEALTH_TABLE = process.env.HEALTH_TABLE || 'Medtronic_Health'
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

// ─── DOCTOR LIST ENDPOINT ─────────────────────────────────────────────────────

// GET /doctors — list all users with role = "doctor"
app.get('/doctors', async function(req, res) {
  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#r = :role',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':role': { S: 'doctor' } },
      ProjectionExpression: 'userId, fullName',
    }));
    const doctors = (result.Items || []).map(i => ({
      userId:   i.userId?.S,
      fullName: i.fullName?.S,
    }));
    res.json({ doctors });
  } catch (err) {
    console.error('Get doctors error:', err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// ─── PATIENT ENDPOINTS ────────────────────────────────────────────────────────

// POST /patients — admin creates a new patient and assigns to a doctor
app.post('/patients', async function(req, res) {
  const { fullName, age, doctorId, createdByAdminId } = req.body || {};
  if (!fullName || !doctorId) {
    return res.status(400).json({ error: 'fullName and doctorId are required' });
  }

  const patientId = 'P-' + Date.now();
  const now = new Date().toISOString();

  try {
    // Write 3 records atomically:
    // 1. Patient PROFILE
    // 2. PatientDoctorLink  (PATIENT → DOCTOR)
    // 3. DoctorPatientLink  (DOCTOR  → PATIENT)
    await dynamo.send(new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: HEALTH_TABLE,
            Item: {
              PK:              { S: `PATIENT#${patientId}` },
              SK:              { S: 'PROFILE' },
              type:            { S: 'PatientProfile' },
              patientId:       { S: patientId },
              fullName:        { S: fullName },
              age:             { N: String(age || 0) },
              assignedDoctorId:{ S: doctorId },
              createdByAdminId:{ S: createdByAdminId || '' },
              status:          { S: 'active' },
              GSI1PK:          { S: 'ALL_PATIENTS' },
              createdAt:       { S: now },
            },
          },
        },
        {
          Put: {
            TableName: HEALTH_TABLE,
            Item: {
              PK:       { S: `PATIENT#${patientId}` },
              SK:       { S: `DOCTOR#${doctorId}` },
              type:     { S: 'PatientDoctorLink' },
              linkedAt: { S: now },
            },
          },
        },
        {
          Put: {
            TableName: HEALTH_TABLE,
            Item: {
              PK:       { S: `DOCTOR#${doctorId}` },
              SK:       { S: `PATIENT#${patientId}` },
              type:     { S: 'DoctorPatientLink' },
              fullName: { S: fullName },
              linkedAt: { S: now },
            },
          },
        },
      ],
    }));

    res.status(201).json({ success: true, patientId });
  } catch (err) {
    console.error('Create patient error:', err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// GET /patients — admin: all patients via GSI | doctor: their patients via doctorId
app.get('/patients', async function(req, res) {
  const { doctorId } = req.query;

  try {
    if (doctorId) {
      // Doctor view: query DOCTOR#doctorId → PATIENT# links
      const result = await dynamo.send(new QueryCommand({
        TableName: HEALTH_TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': { S: `DOCTOR#${doctorId}` },
          ':sk': { S: 'PATIENT#' },
        },
      }));
      const patients = (result.Items || []).map(i => ({
        patientId: i.SK?.S?.replace('PATIENT#', ''),
        fullName:  i.fullName?.S,
        linkedAt:  i.linkedAt?.S,
      }));
      return res.json({ patients });
    }

    // Admin view: all patients via GSI1PK = "ALL_PATIENTS"
    const result = await dynamo.send(new QueryCommand({
      TableName: HEALTH_TABLE,
      IndexName: 'GSI1PK-index',
      KeyConditionExpression: 'GSI1PK = :gsi',
      ExpressionAttributeValues: { ':gsi': { S: 'ALL_PATIENTS' } },
    }));
    const patients = (result.Items || []).map(i => ({
      patientId:        i.patientId?.S,
      fullName:         i.fullName?.S,
      age:              i.age?.N,
      assignedDoctorId: i.assignedDoctorId?.S,
      status:           i.status?.S,
      createdAt:        i.createdAt?.S,
    }));
    res.json({ patients });
  } catch (err) {
    console.error('Get patients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /patients/:patientId — get a single patient profile
app.get('/patients/:patientId', async function(req, res) {
  const { patientId } = req.params;
  try {
    const result = await dynamo.send(new GetItemCommand({
      TableName: HEALTH_TABLE,
      Key: { PK: { S: `PATIENT#${patientId}` }, SK: { S: 'PROFILE' } },
    }));
    if (!result.Item) return res.status(404).json({ error: 'Patient not found' });
    const i = result.Item;
    res.json({
      patientId:        i.patientId?.S,
      fullName:         i.fullName?.S,
      age:              i.age?.N,
      assignedDoctorId: i.assignedDoctorId?.S,
      status:           i.status?.S,
      createdAt:        i.createdAt?.S,
    });
  } catch (err) {
    console.error('Get patient error:', err);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// PUT /patients/:patientId — admin reassigns patient to a different doctor
app.put('/patients/:patientId', async function(req, res) {
  const { patientId } = req.params;
  const { newDoctorId } = req.body || {};
  if (!newDoctorId) return res.status(400).json({ error: 'newDoctorId is required' });

  const now = new Date().toISOString();

  try {
    // Get current patient profile to find old doctorId
    const profileResult = await dynamo.send(new GetItemCommand({
      TableName: HEALTH_TABLE,
      Key: { PK: { S: `PATIENT#${patientId}` }, SK: { S: 'PROFILE' } },
    }));
    if (!profileResult.Item) return res.status(404).json({ error: 'Patient not found' });
    const oldDoctorId = profileResult.Item.assignedDoctorId?.S;

    // Get patient fullName for the new DoctorPatientLink record
    const fullName = profileResult.Item.fullName?.S || '';

    await dynamo.send(new TransactWriteItemsCommand({
      TransactItems: [
        // Update patient PROFILE with new doctor
        {
          Put: {
            TableName: HEALTH_TABLE,
            Item: {
              ...profileResult.Item,
              assignedDoctorId: { S: newDoctorId },
              updatedAt:        { S: now },
            },
          },
        },
        // New PatientDoctorLink
        {
          Put: {
            TableName: HEALTH_TABLE,
            Item: {
              PK: { S: `PATIENT#${patientId}` }, SK: { S: `DOCTOR#${newDoctorId}` },
              type: { S: 'PatientDoctorLink' }, linkedAt: { S: now },
            },
          },
        },
        // New DoctorPatientLink
        {
          Put: {
            TableName: HEALTH_TABLE,
            Item: {
              PK: { S: `DOCTOR#${newDoctorId}` }, SK: { S: `PATIENT#${patientId}` },
              type: { S: 'DoctorPatientLink' }, fullName: { S: fullName }, linkedAt: { S: now },
            },
          },
        },
        // Remove old DoctorPatientLink
        {
          Delete: {
            TableName: HEALTH_TABLE,
            Key: {
              PK: { S: `DOCTOR#${oldDoctorId}` },
              SK: { S: `PATIENT#${patientId}` },
            },
          },
        },
      ],
    }));

    res.json({ success: true, patientId, newDoctorId });
  } catch (err) {
    console.error('Reassign patient error:', err);
    res.status(500).json({ error: 'Failed to reassign patient' });
  }
});

// ─── PUSH TOKEN ───────────────────────────────────────────────────────────────

// PUT /users/push-token — persist Expo push token for a doctor
app.put('/users/push-token', async function(req, res) {
  const { email, pushToken } = req.body || {};
  if (!email || !pushToken) return res.status(400).json({ error: 'email and pushToken required' });
  try {
    await dynamo.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { userId: { S: email } },
      UpdateExpression: 'SET pushToken = :pt',
      ExpressionAttributeValues: { ':pt': { S: pushToken } },
    }));
    res.json({ success: true });
  } catch (err) {
    console.error('Save push token error:', err);
    res.status(500).json({ error: 'Failed to save push token' });
  }
});

// ─── READINGS ─────────────────────────────────────────────────────────────────

const PH_CRITICAL_LOW  = 6.5;
const PH_WARN_LOW      = 6.8;
const PH_WARN_HIGH     = 7.6;
const PH_CRITICAL_HIGH = 8.0;

function getSeverity(pH) {
  if (pH < PH_CRITICAL_LOW || pH > PH_CRITICAL_HIGH) return 'critical';
  if (pH < PH_WARN_LOW     || pH > PH_WARN_HIGH)     return 'warning';
  return 'normal';
}

async function sendExpoPushNotification(pushToken, title, body) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, sound: 'default', priority: 'high' }),
    });
  } catch (err) {
    console.warn('Expo push error:', err.message);
  }
}

// POST /readings — store a sensor reading; generate alert + push if pH out of range
app.post('/readings', async function(req, res) {
  const { patientId, pH, voltage, timestamp } = req.body || {};
  if (!patientId || pH == null) return res.status(400).json({ error: 'patientId and pH required' });

  const now = timestamp || new Date().toISOString();
  const readingSK = `READING#${now}`;
  const severity = getSeverity(pH);

  try {
    // 1. Store the reading
    await dynamo.send(new PutItemCommand({
      TableName: HEALTH_TABLE,
      Item: {
        PK:        { S: `PATIENT#${patientId}` },
        SK:        { S: readingSK },
        type:      { S: 'Reading' },
        patientId: { S: patientId },
        pH:        { N: String(pH) },
        voltage:   { N: String(voltage || 0) },
        timestamp: { S: now },
      },
    }));

    // 2. If out of range, create alert record and push to doctor
    if (severity !== 'normal') {
      const profileResult = await dynamo.send(new GetItemCommand({
        TableName: HEALTH_TABLE,
        Key: { PK: { S: `PATIENT#${patientId}` }, SK: { S: 'PROFILE' } },
      }));
      const profile = profileResult.Item;
      const doctorEmail = profile?.assignedDoctorId?.S;
      const patientName = profile?.fullName?.S || patientId;

      if (doctorEmail) {
        const title = severity === 'critical' ? 'Critical pH Alert' : 'pH Warning';
        const description = `pH ${parseFloat(pH).toFixed(2)} — ${severity === 'critical' ? 'Immediate attention required' : 'Monitor closely'}`;

        await dynamo.send(new PutItemCommand({
          TableName: HEALTH_TABLE,
          Item: {
            PK:           { S: `ALERT#${doctorEmail}` },
            SK:           { S: `${patientId}#${readingSK}` },
            type:         { S: 'Alert' },
            patientId:    { S: patientId },
            patientName:  { S: patientName },
            doctorEmail:  { S: doctorEmail },
            pH:           { N: String(pH) },
            severity:     { S: severity },
            title:        { S: title },
            description:  { S: description },
            timestamp:    { S: now },
            acknowledged: { BOOL: false },
          },
        }));

        const doctorResult = await dynamo.send(new GetItemCommand({
          TableName: TABLE_NAME,
          Key: { userId: { S: doctorEmail } },
        }));
        const pushToken = doctorResult.Item?.pushToken?.S;
        if (pushToken) {
          await sendExpoPushNotification(pushToken, title, `Patient ${patientName}: ${description}`);
        }
      }
    }

    res.status(201).json({ success: true, readingSK });
  } catch (err) {
    console.error('Post reading error:', err);
    res.status(500).json({ error: 'Failed to save reading' });
  }
});

// GET /patients/:patientId/readings — paginated history, newest first
app.get('/patients/:patientId/readings', async function(req, res) {
  const { patientId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: HEALTH_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': { S: `PATIENT#${patientId}` },
        ':sk': { S: 'READING#' },
      },
      ScanIndexForward: false,
      Limit: limit,
    }));
    const readings = (result.Items || []).map(i => ({
      readingSK: i.SK?.S,
      pH:        parseFloat(i.pH?.N || '0'),
      voltage:   parseFloat(i.voltage?.N || '0'),
      timestamp: i.timestamp?.S,
    }));
    res.json({ readings });
  } catch (err) {
    console.error('Get readings error:', err);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

// ─── ALERTS ───────────────────────────────────────────────────────────────────

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// GET /alerts — all alerts for a doctor, newest first
app.get('/alerts', async function(req, res) {
  const { doctorEmail } = req.query;
  if (!doctorEmail) return res.status(400).json({ error: 'doctorEmail query param required' });
  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: HEALTH_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': { S: `ALERT#${doctorEmail}` } },
      ScanIndexForward: false,
    }));
    const alerts = (result.Items || []).map(i => ({
      patientId:    i.patientId?.S,
      patientName:  i.patientName?.S,
      pH:           parseFloat(i.pH?.N || '0'),
      severity:     i.severity?.S,
      title:        i.title?.S,
      description:  i.description?.S,
      timestamp:    i.timestamp?.S,
      timeAgo:      timeAgo(i.timestamp?.S),
      // SK is "patientId#READING#timestamp" — strip the patientId# prefix so frontend gets "READING#..."
      readingSK:    i.SK?.S?.replace(`${i.patientId?.S}#`, ''),
      acknowledged: i.acknowledged?.BOOL ?? false,
    }));
    res.json(alerts);
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /alerts/acknowledge — mark a specific alert as acknowledged
app.post('/alerts/acknowledge', async function(req, res) {
  const { patientId, readingSK, doctorEmail } = req.body || {};
  if (!patientId || !readingSK || !doctorEmail) {
    return res.status(400).json({ error: 'patientId, readingSK, and doctorEmail required' });
  }
  try {
    await dynamo.send(new UpdateItemCommand({
      TableName: HEALTH_TABLE,
      Key: {
        PK: { S: `ALERT#${doctorEmail}` },
        SK: { S: `${patientId}#${readingSK}` },
      },
      UpdateExpression: 'SET acknowledged = :val',
      ExpressionAttributeValues: { ':val': { BOOL: true } },
    }));
    res.json({ success: true });
  } catch (err) {
    console.error('Acknowledge alert error:', err);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
