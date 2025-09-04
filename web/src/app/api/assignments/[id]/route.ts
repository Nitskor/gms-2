import { MongoClient, ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI!;

// GET - Get a specific assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new MongoClient(uri);
  try {
    const { id } = await params;
    await client.connect();
    const database = client.db('gms');
    const assignmentsCollection = database.collection('assignments');
    const employeesCollection = database.collection('employees');
    const clientsCollection = database.collection('clients');
    
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    // Populate employee and client details
    const employee = await employeesCollection.findOne({ 
      employeeId: assignment.employeeId 
    });
    
    const clientData = await clientsCollection.findOne({ 
      clientCode: assignment.clientCode 
    });
    
    const populatedAssignment = {
      ...assignment,
      employee: employee ? {
        name: employee.name,
        designation: employee.designation,
        phone: employee.contactInfo?.phone
      } : null,
      client: clientData ? {
        companyName: clientData.companyName,
        contactPerson: clientData.contactPerson
      } : null
    };
    
    return NextResponse.json(populatedAssignment);
    
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch assignment' 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}

// PUT - Update a specific assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new MongoClient(uri);
  try {
    const body = await request.json();
    const { employeeId, status } = body;
    const { id } = await params;
    
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('assignments');
    
    // Update the assignment
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          employeeId,
          status,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Assignment updated successfully',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// DELETE - Delete a specific assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new MongoClient(uri);
  try {
    const { id } = await params;
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('assignments');
    
    // Delete the assignment
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Assignment deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  } finally {
    await client.close();
  }
}
