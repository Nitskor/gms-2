import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI!;

// Generate unique assignment ID
async function generateAssignmentId() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('assignments');
    
    const lastAssignment = await collection
      .find({})
      .sort({ assignmentId: -1 })
      .limit(1)
      .toArray();
    
    if (lastAssignment.length === 0) {
      return 'ASN-001';
    }
    
    const lastId = lastAssignment[0].assignmentId;
    const lastNumber = parseInt(lastId.split('-')[1]);
    const newNumber = lastNumber + 1;
    return `ASN-${newNumber.toString().padStart(3, '0')}`;
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  const client = new MongoClient(uri);
  try {
    const body = await request.json();
    console.log('Received assignment data:', body);
    
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('assignments');
    
    // Generate assignment ID
    const assignmentId = await generateAssignmentId();
    
    // Create assignment document
    const assignment = {
      assignmentId,
      employeeId: body.employeeId || '', // Allow empty employeeId for pending assignments
      clientCode: body.clientCode,
      siteId: body.siteId,
      shiftId: body.shiftId,
      designation: body.designation,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      status: body.status || 'active', // Use status from request or default to active
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(assignment);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      assignmentId: assignmentId
    });
    
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ 
      error: 'Failed to create assignment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function GET() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('gms');
    const assignmentsCollection = database.collection('assignments');
    const employeesCollection = database.collection('employees');
    const clientsCollection = database.collection('clients');
    
    // Get all assignments with populated data
    const assignments = await assignmentsCollection.find({}).toArray();
    
    // Populate employee and client details
    const populatedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const employee = await employeesCollection.findOne({ 
          employeeId: assignment.employeeId 
        });
        
        const client = await clientsCollection.findOne({ 
          clientCode: assignment.clientCode 
        });
        
        return {
          ...assignment,
          employee: employee ? {
            name: employee.name,
            designation: employee.designation,
            phone: employee.contactInfo?.phone
          } : null,
          client: client ? {
            companyName: client.companyName,
            contactPerson: client.contactPerson
          } : null
        };
      })
    );
    
    return NextResponse.json(populatedAssignments);
    
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch assignments' 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}