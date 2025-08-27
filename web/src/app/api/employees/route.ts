import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

// Generate unique employee ID
async function generateEmployeeId() {
  await client.connect();
  const database = client.db('gms');
  const collection = database.collection('employees');
  
  const lastEmployee = await collection
    .find({})
    .sort({ employeeId: -1 })
    .limit(1)
    .toArray();
  
  if (lastEmployee.length === 0) {
    return 'EMP-001';
  }
  
  const lastId = lastEmployee[0].employeeId;
  const lastNumber = parseInt(lastId.split('-')[1]);
  const newNumber = lastNumber + 1;
  return `EMP-${newNumber.toString().padStart(3, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received employee data:', body);
    
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('employees');
    
    // Generate employee ID
    const employeeId = await generateEmployeeId();
    
    // Create employee document
    const employee = {
      employeeId,
      name: body.name,
      designation: body.designation,
      joinDate: new Date(body.joinDate),
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      dateOfLeaving: body.dateOfLeaving ? new Date(body.dateOfLeaving) : null,
      status: 'active',
      contactInfo: {
        phone: body.phone,
        email: body.email,
        address: body.address
      },
      documents: {
        aadharNumber: body.aadharNumber,
        panNumber: body.panNumber
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(employee);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      employeeId: employeeId
    });
    
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ 
      error: 'Failed to create employee',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function GET() {
  try {
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('employees');
    
    const employees = await collection.find({}).toArray();
    return NextResponse.json(employees);
    
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch employees' 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}