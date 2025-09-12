// Simple PDF test
const testScore = {
  title: "Shakuhachi Score", // Using English title to avoid encoding issues
  phrases: [
    {
      notes: [
        { katakana: "ロ", fingering: "ro", pitch: 293.66, duration: 1.0 }
      ],
      breath: true
    }
  ]
};

async function testPDF() {
  try {
    const response = await fetch('http://localhost:3000/api/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score: testScore })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (response.ok) {
      console.log('✅ PDF generated successfully!');
      // Save to file for testing
      const buffer = await response.arrayBuffer();
      console.log('📄 PDF size:', buffer.byteLength, 'bytes');
    } else {
      const errorText = await response.text();
      console.log('❌ PDF generation failed:', errorText);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPDF();