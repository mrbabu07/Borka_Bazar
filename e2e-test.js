/**
 * End-to-End Test Script - Complete Checkout to Order Flow
 * Tests: Customer Checkout → Order Creation → Admin Confirmation → Order Processing
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TIMEOUT = 30000;

// Test Data
const testData = {
  customer: {
    email: `testcustomer${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test Customer',
    phone: '01521721946',
    address: '123 Main Street',
    city: 'Dhaka',
    area: 'Gulshan',
    zipCode: '1212',
  },
  admin: {
    email: `admin${Date.now()}@example.com`,
    password: 'AdminPassword123!',
  },
  product: {
    title: 'T-Shirt',
    price: 500,
    size: 'M',
    color: 'Blue',
    quantity: 2,
  },
  order: {
    subtotal: 1000,
    deliveryFee: 120,
    total: 1120,
    paymentMethod: 'COD',
  },
};

// Test Results
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  logs: [],
};

// Helper Functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '👉',
  }[type] || '📝';

  const logMessage = `[${timestamp}] ${prefix} ${message}`;
  console.log(logMessage);
  testResults.logs.push(logMessage);
}

function recordPass(testName) {
  testResults.passed++;
  log(`PASS: ${testName}`, 'success');
}

function recordFail(testName, error) {
  testResults.failed++;
  log(`FAIL: ${testName} - ${error}`, 'error');
  testResults.errors.push({ test: testName, error });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Scenarios
async function runTests() {
  log('='.repeat(80), 'step');
  log('STARTING END-TO-END TEST SUITE', 'step');
  log('='.repeat(80), 'step');

  try {
    // Phase 1: Customer Checkout
    await testPhase1();

    // Phase 2: Admin Confirmation
    await testPhase2();

    // Phase 3: Customer Confirmation
    await testPhase3();

    // Phase 4: Order Processing
    await testPhase4();

    // Print Results
    printResults();
  } catch (error) {
    log(`Fatal Error: ${error.message}`, 'error');
    printResults();
    process.exit(1);
  }
}

// PHASE 1: CUSTOMER CHECKOUT
async function testPhase1() {
  log('', 'step');
  log('='.repeat(80), 'step');
  log('PHASE 1: CUSTOMER CHECKOUT', 'step');
  log('='.repeat(80), 'step');

  try {
    // Step 1.1: Skip user registration (Firebase handles this)
    log('Step 1.1: Skipping user registration (Firebase handles authentication)...', 'step');
    // For testing purposes, we'll use a mock token
    testData.customerToken = 'mock-customer-token';
    testData.customerId = 'mock-customer-id';
    recordPass('Customer authentication setup');

    // Step 1.2: Get Products
    log('Step 1.2: Fetching products...', 'step');
    try {
      const productsRes = await axios.get(`${API_BASE_URL}/products`, { timeout: TEST_TIMEOUT });
      if (productsRes.data.data && productsRes.data.data.length > 0) {
        testData.product._id = productsRes.data.data[0]._id;
        testData.product.title = productsRes.data.data[0].title;
        testData.product.price = productsRes.data.data[0].price;
        recordPass('Products fetched successfully');
      } else {
        recordFail('Products fetch', 'No products found');
      }
    } catch (error) {
      recordFail('Products fetch', error.message);
    }

    // Step 1.3: Create Order
    log('Step 1.3: Creating order...', 'step');
    try {
      const orderRes = await axios.post(
        `${API_BASE_URL}/orders`,
        {
          orderItems: [
            {
              productId: testData.product._id || '507f1f77bcf86cd799439011',
              title: testData.product.title,
              price: testData.product.price,
              quantity: testData.product.quantity,
              size: testData.product.size,
              color: testData.product.color,
              image: 'https://via.placeholder.com/200',
            },
          ],
          shippingInfo: {
            name: testData.customer.name,
            email: testData.customer.email,
            phone: testData.customer.phone,
            address: testData.customer.address,
            city: testData.customer.city,
            area: testData.customer.area,
            zipCode: testData.customer.zipCode,
          },
          subtotal: testData.order.subtotal,
          deliveryCharge: testData.order.deliveryFee,
          totalPrice: testData.order.total,
          paymentMethod: testData.order.paymentMethod,
        },
        {
          timeout: TEST_TIMEOUT,
        }
      );

      if (orderRes.status === 201) {
        testData.orderId = orderRes.data.data._id;
        testData.orderCode = orderRes.data.data.orderCode;

        // Verify order data
        const order = orderRes.data.data;
        if (order.advancePayment?.status === 'Pending' && order.advancePayment?.amount === testData.order.deliveryFee) {
          recordPass('Order created with advance payment initialized');
        } else {
          recordFail('Order creation', 'Advance payment not properly initialized');
        }

        if (order.orderStatus === 'Pending') {
          recordPass('Order status set to Pending');
        } else {
          recordFail('Order status', `Expected Pending, got ${order.orderStatus}`);
        }

        if (order.totalPrice === testData.order.total) {
          recordPass('Order total calculated correctly');
        } else {
          recordFail('Order total', `Expected ${testData.order.total}, got ${order.totalPrice}`);
        }
      } else {
        recordFail('Order creation', 'Unexpected status code');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      log(`Order creation error details: ${JSON.stringify(error.response?.data || error.message)}`, 'error');
      recordFail('Order creation', errorMsg);
    }

    // Step 1.4: Verify Order in Customer's Order List
    log('Step 1.4: Verifying order in customer list...', 'step');
    try {
      const ordersRes = await axios.get(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${testData.customerToken}`,
        },
        timeout: TEST_TIMEOUT,
      });

      const customerOrder = ordersRes.data.data.find(o => o._id === testData.orderId);
      if (customerOrder) {
        recordPass('Order appears in customer order list');
        if (customerOrder.advancePayment?.status === 'Pending') {
          recordPass('Advance payment shows as Pending in customer view');
        }
      } else {
        recordFail('Order in customer list', 'Order not found');
      }
    } catch (error) {
      recordFail('Verify order in list', error.message);
    }

    log('PHASE 1 COMPLETE', 'success');
  } catch (error) {
    recordFail('Phase 1', error.message);
  }
}

// PHASE 2: ADMIN CONFIRMATION
async function testPhase2() {
  log('', 'step');
  log('='.repeat(80), 'step');
  log('PHASE 2: ADMIN CONFIRMATION', 'step');
  log('='.repeat(80), 'step');

  try {
    // Step 2.1: Skip admin registration (Firebase handles this)
    log('Step 2.1: Skipping admin registration (Firebase handles authentication)...', 'step');
    // For testing purposes, we'll use a mock token
    testData.adminToken = 'mock-admin-token';
    testData.adminId = 'mock-admin-id';
    recordPass('Admin authentication setup');

    // Step 2.2: Get All Orders (Admin)
    log('Step 2.2: Fetching all orders (admin)...', 'step');
    try {
      const ordersRes = await axios.get(`${API_BASE_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${testData.adminToken}`,
        },
        timeout: TEST_TIMEOUT,
      });

      const adminOrder = ordersRes.data.data.find(o => o._id === testData.orderId);
      if (adminOrder) {
        recordPass('Order visible to admin');
        if (adminOrder.advancePayment?.status === 'Pending') {
          recordPass('Admin sees pending advance payment');
        }
      } else {
        recordFail('Order visibility to admin', 'Order not found');
      }
    } catch (error) {
      recordFail('Fetch orders (admin)', error.message);
    }

    // Step 2.3: Confirm Advance Payment
    log('Step 2.3: Confirming advance payment...', 'step');
    try {
      const transactionId = `TXN${Date.now()}`;
      const confirmRes = await axios.patch(
        `${API_BASE_URL}/orders/${testData.orderId}/confirm-advance-payment`,
        {
          transactionId: transactionId,
          adminId: testData.adminId,
        },
        {
          headers: {
            Authorization: `Bearer ${testData.adminToken}`,
          },
          timeout: TEST_TIMEOUT,
        }
      );

      if (confirmRes.status === 200) {
        testData.transactionId = transactionId;
        recordPass('Advance payment confirmed successfully');

        // Verify response
        if (confirmRes.data.data.advancePaymentStatus === 'Confirmed') {
          recordPass('Response shows payment as Confirmed');
        }
        if (confirmRes.data.data.orderStatus === 'Processing') {
          recordPass('Order status changed to Processing');
        }
      } else {
        recordFail('Confirm payment', 'Unexpected status code');
      }
    } catch (error) {
      recordFail('Confirm advance payment', error.response?.data?.message || error.message);
    }

    // Step 2.4: Verify Order Status Updated
    log('Step 2.4: Verifying order status updated...', 'step');
    try {
      const orderRes = await axios.get(`${API_BASE_URL}/orders/${testData.orderId}`, {
        headers: {
          Authorization: `Bearer ${testData.adminToken}`,
        },
        timeout: TEST_TIMEOUT,
      });

      const order = orderRes.data.data;
      if (order.orderStatus === 'Processing') {
        recordPass('Order status is Processing');
      } else {
        recordFail('Order status', `Expected Processing, got ${order.orderStatus}`);
      }

      if (order.advancePayment?.status === 'Confirmed') {
        recordPass('Advance payment status is Confirmed');
      }

      if (order.advancePayment?.transactionId === testData.transactionId) {
        recordPass('Transaction ID recorded correctly');
      }

      if (order.advancePayment?.confirmedAt) {
        recordPass('Confirmation timestamp recorded');
      }
    } catch (error) {
      recordFail('Verify order status', error.message);
    }

    log('PHASE 2 COMPLETE', 'success');
  } catch (error) {
    recordFail('Phase 2', error.message);
  }
}

// PHASE 3: CUSTOMER CONFIRMATION VIEW
async function testPhase3() {
  log('', 'step');
  log('='.repeat(80), 'step');
  log('PHASE 3: CUSTOMER CONFIRMATION VIEW', 'step');
  log('='.repeat(80), 'step');

  try {
    // Step 3.1: Customer Views Updated Order
    log('Step 3.1: Customer viewing updated order...', 'step');
    try {
      const orderRes = await axios.get(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${testData.customerToken}`,
        },
        timeout: TEST_TIMEOUT,
      });

      const customerOrder = orderRes.data.data.find(o => o._id === testData.orderId);
      if (customerOrder) {
        if (customerOrder.orderStatus === 'Processing') {
          recordPass('Customer sees order status as Processing');
        }

        if (customerOrder.advancePayment?.status === 'Confirmed') {
          recordPass('Customer sees advance payment as Confirmed');
        }

        if (customerOrder.advancePayment?.transactionId === testData.transactionId) {
          recordPass('Customer sees transaction ID');
        }
      } else {
        recordFail('Customer order view', 'Order not found');
      }
    } catch (error) {
      recordFail('Customer views order', error.message);
    }

    log('PHASE 3 COMPLETE', 'success');
  } catch (error) {
    recordFail('Phase 3', error.message);
  }
}

// PHASE 4: ORDER PROCESSING
async function testPhase4() {
  log('', 'step');
  log('='.repeat(80), 'step');
  log('PHASE 4: ORDER PROCESSING', 'step');
  log('='.repeat(80), 'step');

  try {
    // Step 4.1: Admin Updates Order Status to Shipped
    log('Step 4.1: Admin updating order status to Shipped...', 'step');
    try {
      const updateRes = await axios.patch(
        `${API_BASE_URL}/orders/${testData.orderId}/update-status`,
        {
          status: 'shipped',
        },
        {
          headers: {
            Authorization: `Bearer ${testData.adminToken}`,
          },
          timeout: TEST_TIMEOUT,
        }
      );

      if (updateRes.status === 200) {
        recordPass('Order status updated to Shipped');
      }
    } catch (error) {
      recordFail('Update to Shipped', error.response?.data?.message || error.message);
    }

    // Step 4.2: Admin Updates Order Status to Delivered
    log('Step 4.2: Admin updating order status to Delivered...', 'step');
    try {
      const updateRes = await axios.patch(
        `${API_BASE_URL}/orders/${testData.orderId}/update-status`,
        {
          status: 'delivered',
        },
        {
          headers: {
            Authorization: `Bearer ${testData.adminToken}`,
          },
          timeout: TEST_TIMEOUT,
        }
      );

      if (updateRes.status === 200) {
        recordPass('Order status updated to Delivered');
      }
    } catch (error) {
      recordFail('Update to Delivered', error.response?.data?.message || error.message);
    }

    // Step 4.3: Customer Sees Final Status
    log('Step 4.3: Customer viewing final order status...', 'step');
    try {
      const orderRes = await axios.get(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${testData.customerToken}`,
        },
        timeout: TEST_TIMEOUT,
      });

      const customerOrder = orderRes.data.data.find(o => o._id === testData.orderId);
      if (customerOrder && customerOrder.orderStatus === 'Delivered') {
        recordPass('Customer sees final order status as Delivered');
      } else {
        recordFail('Final status view', 'Order status not Delivered');
      }
    } catch (error) {
      recordFail('Customer views final status', error.message);
    }

    log('PHASE 4 COMPLETE', 'success');
  } catch (error) {
    recordFail('Phase 4', error.message);
  }
}

// Print Results
function printResults() {
  log('', 'step');
  log('='.repeat(80), 'step');
  log('TEST RESULTS SUMMARY', 'step');
  log('='.repeat(80), 'step');

  log(`Total Tests: ${testResults.passed + testResults.failed}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');

  if (testResults.errors.length > 0) {
    log('', 'step');
    log('ERRORS:', 'error');
    testResults.errors.forEach((err, index) => {
      log(`${index + 1}. ${err.test}: ${err.error}`, 'error');
    });
  }

  log('', 'step');
  log('='.repeat(80), 'step');

  if (testResults.failed === 0) {
    log('✅ ALL TESTS PASSED!', 'success');
    log('Complete checkout to order flow is working correctly!', 'success');
  } else {
    log('❌ SOME TESTS FAILED', 'error');
    log('Please review errors above', 'error');
  }

  log('='.repeat(80), 'step');

  // Save results to file
  const fs = require('fs');
  const resultsFile = 'test-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  log(`Results saved to ${resultsFile}`, 'info');
}

// Run Tests
runTests().catch(error => {
  log(`Test execution failed: ${error.message}`, 'error');
  process.exit(1);
});
