import { createInquiry, getMyInquiries, getAllInquiriesAdmin, updateInquiryStatus, saveAdminResponse, saveAdminNotes } from '../controllers/inquiryController.js';

async function testInquiriesFlow() {
  console.log('--- Testing Inquiries Flow ---');

  // Mock Request & Response for Guest Submission
  const req1 = {
    body: {
      name: 'Vansh Mittal',
      email: 'vansh@example.com',
      phone: '+91 98765 43210',
      message: 'I want to know about bulk orders for festival gifting.',
    },
    user: undefined, // guest
  };

  let createdInquiry = null;
  const res1 = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Guest Create Response Status:', this.statusCode || 200);
      console.log('Guest Create Response Data:', data);
      if (data.success) {
        createdInquiry = data.inquiry;
      }
      return data;
    }
  };

  await createInquiry(req1, res1);

  if (!createdInquiry) {
    console.error('❌ Failed to create inquiry');
    return;
  }

  // Mock Request & Response for Logged In Customer Submission
  const req2 = {
    body: {
      name: 'Customer User',
      email: 'customer@example.com',
      phone: '+91 99999 88888',
      message: 'Do you provide gluten-free macro nutrition boxes?',
    },
    user: { id: 'usr_test_123', email: 'customer@example.com' },
  };

  let customerInquiry = null;
  const res2 = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) {
      console.log('Customer Create Response Status:', this.statusCode || 200);
      console.log('Customer Create Response Data:', data);
      if (data.success) {
        customerInquiry = data.inquiry;
      }
      return data;
    }
  };

  await createInquiry(req2, res2);

  // Test Customer Get My Inquiries
  const reqMy = {
    user: { id: 'usr_test_123' },
  };
  const resMy = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) {
      console.log('Customer Get My Inquiries Response:', data);
      return data;
    }
  };

  await getMyInquiries(reqMy, resMy);

  // Test Admin Get All Inquiries
  const reqAdmin = {
    query: { search: '', status: 'all', sort: 'newest' }
  };
  const resAdmin = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) {
      console.log('Admin Get All Summary:', data.summary);
      console.log('Admin Get All Count:', data.count);
      return data;
    }
  };

  await getAllInquiriesAdmin(reqAdmin, resAdmin);

  // Test Admin Status Update to 'contacted'
  const reqStatus = {
    params: { id: createdInquiry.id },
    body: { status: 'contacted' }
  };
  const resStatus = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) {
      console.log('Admin Update Status Response:', data);
      return data;
    }
  };

  await updateInquiryStatus(reqStatus, resStatus);

  // Test Admin Save Response
  const reqResp = {
    params: { id: createdInquiry.id },
    body: { admin_response: 'Thank you for reaching out! Yes, we offer festive bulk discounts for orders over 50 boxes.' }
  };
  const resResp = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) {
      console.log('Admin Save Response:', data);
      return data;
    }
  };

  await saveAdminResponse(reqResp, resResp);

  console.log('--- Inquiries Flow Test Complete ---');
}

testInquiriesFlow();
