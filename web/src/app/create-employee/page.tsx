'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEmployee() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    joinDate: '',
    dateOfBirth: '',
    dateOfLeaving: '',
    phone: '',
    email: '',
    address: '',
    aadharNumber: '',
    panNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Employee created successfully!');
        router.push('/employees');
      } else {
        alert('Error creating employee: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Employee</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter full name"
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Designation *
            </label>
            <select
              required
              value={formData.designation}
              onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Select Designation</option>
              <option value="Security Guard">Security Guard</option>
              <option value="Supervisor">Supervisor</option>
              <option value="SO/ASO">SO/ASO</option>
              <option value="Field Officer">Field Officer</option>
            </select>
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join Date *
            </label>
            <input
              type="date"
              required
              value={formData.joinDate}
              onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Date of Leaving */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Leaving (if applicable)
            </label>
            <input
              type="date"
              value={formData.dateOfLeaving}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfLeaving: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter email address"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter address"
            />
          </div>

          {/* Aadhar Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aadhar Number
            </label>
            <input
              type="text"
              value={formData.aadharNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="XXXX-XXXX-XXXX"
            />
          </div>

          {/* PAN Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PAN Number
            </label>
            <input
              type="text"
              value={formData.panNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="ABCDE1234F"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/employees')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}