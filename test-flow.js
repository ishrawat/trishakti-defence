const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log("🚀 Starting Diagnostic Flow Test...");
  
  try {
    // 1. Fetch list of tests
    console.log("Fetching available tests...");
    const testsRes = await fetch(`${BASE_URL}/api/questions`);
    const tests = await testsRes.json();
    if (!tests || tests.length === 0) {
      console.log("❌ No tests found. Please create a test in the teacher dashboard first.");
      return;
    }
    
    const testId = tests[0].id;
    console.log(`✅ Found Test ID: ${testId}`);

    // 2. Fetch FULL test data (which includes questions)
    console.log("Fetching full test details...");
    const fullTestRes = await fetch(`${BASE_URL}/api/mocktests/${testId}`);
    const fullTest = await fullTestRes.json();
    
    if (!fullTest.sections || !fullTest.sections[0].questions || fullTest.sections[0].questions.length === 0) {
      console.log("❌ Test has no questions. Please add questions in the dashboard first.");
      return;
    }
    const questionId = fullTest.sections[0].questions[0].id;
    console.log(`✅ Found Question ID: ${questionId}`);

    // 3. Start Test 1
    console.log("\n▶️ Starting Attempt 1 (ForceNew)...");
    let startRes = await fetch(`${BASE_URL}/api/attempts/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId, forceNew: true })
    });
    let attempt1 = await startRes.json();
    console.log(`✅ Attempt 1 Created. ID: ${attempt1.id}. Responses: ${attempt1.responses.length}`);

    // 4. Save Answer
    console.log("\n💾 Saving Answer 'A' to first question...");
    await fetch(`${BASE_URL}/api/attempts/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: attempt1.id, questionId, selectedOption: 'A', status: 'ANSWERED', timeSpent: 10 })
    });

    // 5. Log Violation
    console.log("⚠️ Logging Tab Switch Violation...");
    await fetch(`${BASE_URL}/api/attempts/violation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: attempt1.id, type: 'TAB_SWITCH' })
    });

    // 6. Submit
    console.log("📤 Submitting Attempt 1...");
    await fetch(`${BASE_URL}/api/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: attempt1.id })
    });

    // 7. Start Test 2
    console.log("\n🔄 Reattempting Test (ForceNew)...");
    startRes = await fetch(`${BASE_URL}/api/attempts/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId, forceNew: true })
    });
    let attempt2 = await startRes.json();
    console.log(`✅ Attempt 2 Created. ID: ${attempt2.id}. Responses: ${attempt2.responses.length}`);
    
    if (attempt2.responses.length > 0) {
      console.log("❌ BUG DETECTED: Attempt 2 still has old responses!");
    } else {
      console.log("✅ Success: Attempt 2 is clean.");
    }

    // 8. Check Admin Results
    console.log("\n🔍 Checking Admin Results Database...");
    const adminRes = await fetch(`${BASE_URL}/api/admin/results`);
    const adminData = await adminRes.json();
    const attempt1Data = adminData.find(a => a.id === attempt1.id);
    console.log(`Attempt 1 Status: ${attempt1Data?.status}, Tab Switches: ${attempt1Data?.tabSwitchCount}`);
    
    if (attempt1Data?.status === 'COMPLETED' && attempt1Data?.tabSwitchCount > 0) {
       console.log("✅ Success: Tab switch and submit recorded in DB.");
    } else {
       console.log("❌ BUG DETECTED: Missing data in DB.");
    }

  } catch (error) {
    console.error("Test Failed:", error.message);
  }
}

runTest();