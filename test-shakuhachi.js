// Test script for the shakuhachi transcription

async function testTranscription() {
  try {
    console.log('Testing YouTube transcription API...\n');
    
    // Test the YouTube API with the shakuhachi video
    const response = await fetch('http://localhost:3000/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://youtu.be/yxJwTEXH-2w?si=PioPzzVxZi2IpMzD'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Transcription successful!');
    console.log('📹 Video:', data.info?.title || 'Unknown title');
    console.log('⏱️  Duration:', data.info?.duration || 'Unknown duration');
    console.log('🎵 Confidence:', data.result?.confidence || 'N/A');
    console.log('\n🎼 KINKO-RYU SCORE:');
    console.log('==================\n');

    if (data.result?.score) {
      const score = data.result.score;
      console.log(`Title: ${score.title}\n`);

      score.phrases?.forEach((phrase, phraseIndex) => {
        console.log(`Phrase ${phraseIndex + 1}:`);
        console.log('───────────');
        
        // Display notes from right to left (traditional Japanese reading)
        const noteDisplay = phrase.notes?.map(note => {
          let display = note.katakana;
          if (note.ornaments?.length > 0) {
            display += ` (${note.ornaments.join(',')})`;
          }
          if (note.techniques?.length > 0) {
            display += ` [${note.techniques.join(',')}]`;
          }
          return display;
        }).reverse().join(' ← ') || 'No notes';
        
        console.log(noteDisplay);
        
        if (phrase.breath) {
          console.log('         、(breath mark)');
        }
        console.log('');
      });

      // Test PDF generation
      console.log('\n📄 Testing PDF generation...');
      const pdfResponse = await fetch('http://localhost:3000/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: score })
      });

      if (pdfResponse.ok) {
        const pdfData = await pdfResponse.json();
        console.log('✅ PDF generated successfully!');
        console.log('📁 PDF URL:', pdfData.url || 'Generated in memory');
      } else {
        console.log('❌ PDF generation failed:', pdfResponse.status);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Enhanced mock data for a more realistic shakuhachi performance
async function testWithEnhancedData() {
  console.log('\n🎹 Creating enhanced shakuhachi transcription...\n');
  
  const enhancedScore = {
    title: 'Hifumi Hachigaeshi (一二三鉢返)',
    phrases: [
      {
        // Opening phrase - slow, meditative
        notes: [
          { katakana: 'ロ', fingering: 'ro', pitch: 293.66, duration: 3.0, ornaments: ['—', '⌒'], techniques: ['meri'] },
          { katakana: 'ツ', fingering: 'tsu', pitch: 349.23, duration: 2.5, ornaments: ['—'], techniques: [] },
          { katakana: 'レ', fingering: 're', pitch: 392.00, duration: 1.8, ornaments: ['＞'], techniques: ['kari'] },
        ],
        breath: true,
        expression: 'Very slow, meditative'
      },
      {
        // Development phrase - more active
        notes: [
          { katakana: 'チ', fingering: 'chi', pitch: 440.00, duration: 1.0, ornaments: [], techniques: ['grace'] },
          { katakana: 'リ', fingering: 'ri', pitch: 523.25, duration: 1.5, ornaments: ['⌒'], techniques: [] },
          { katakana: 'レ◯', fingering: 're-meri', pitch: 415.30, duration: 0.8, ornaments: [], techniques: ['meri'] },
          { katakana: 'ツ', fingering: 'tsu', pitch: 349.23, duration: 1.2, ornaments: [], techniques: [] },
        ],
        breath: true,
        expression: 'Flowing'
      },
      {
        // High register (kan) phrase
        notes: [
          { katakana: '口', fingering: 'kan-ro', pitch: 587.33, duration: 2.0, ornaments: ['—', '＜'], techniques: [] },
          { katakana: '乙', fingering: 'kan-tsu', pitch: 698.46, duration: 1.5, ornaments: ['⌒'], techniques: ['ornamental'] },
          { katakana: '工', fingering: 'kan-re', pitch: 783.99, duration: 1.0, ornaments: ['＞'], techniques: [] },
        ],
        breath: true,
        expression: 'Ascending, powerful'
      },
      {
        // Closing phrase - return to low register
        notes: [
          { katakana: 'レ', fingering: 're', pitch: 392.00, duration: 1.5, ornaments: [], techniques: [] },
          { katakana: 'ツ', fingering: 'tsu', pitch: 349.23, duration: 2.0, ornaments: ['—'], techniques: ['ornamental'] },
          { katakana: 'ロ', fingering: 'ro', pitch: 293.66, duration: 4.0, ornaments: ['—', '⌒', '＞'], techniques: ['meri'] },
        ],
        breath: true,
        expression: 'Slow, contemplative ending'
      }
    ],
    tempo: 85,
    key: 'D',
    metadata: {
      composer: 'Traditional',
      arranger: 'AI Transcription System',
      date: '2025'
    }
  };

  console.log('🎼 ENHANCED KINKO-RYU SCORE:');
  console.log('=============================\n');
  console.log(`Title: ${enhancedScore.title}`);
  console.log(`Tempo: ♩ = ${enhancedScore.tempo}`);
  console.log(`Key: ${enhancedScore.key} (Traditional shakuhachi tuning)\n`);

  enhancedScore.phrases.forEach((phrase, phraseIndex) => {
    console.log(`Phrase ${phraseIndex + 1}: ${phrase.expression || ''}`);
    console.log('─'.repeat(40));
    
    // Display in traditional right-to-left format
    const noteDisplay = phrase.notes.map(note => {
      let display = note.katakana;
      
      // Add ornaments above
      if (note.ornaments && note.ornaments.length > 0) {
        display = `${note.ornaments.join('')}\n ${display}`;
      }
      
      // Add techniques below
      if (note.techniques && note.techniques.length > 0) {
        display += `\n(${note.techniques.join(',')})`;
      }
      
      // Add duration indicator
      if (note.duration > 2.0) {
        display += '\n' + '—'.repeat(Math.floor(note.duration));
      }
      
      return display;
    }).reverse(); // Right to left
    
    console.log(noteDisplay.join('  '));
    
    if (phrase.breath) {
      console.log('\n                    、(息継ぎ / breath)\n');
    }
  });

  // Test PDF generation with enhanced score
  try {
    console.log('📄 Generating enhanced PDF...');
    const pdfResponse = await fetch('http://localhost:3000/api/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score: enhancedScore })
    });

    if (pdfResponse.ok) {
      const pdfData = await pdfResponse.json();
      console.log('✅ Enhanced PDF generated successfully!');
    } else {
      console.log('❌ Enhanced PDF generation failed:', pdfResponse.status);
    }
  } catch (error) {
    console.log('❌ PDF test error:', error.message);
  }
}

// Run the tests
testTranscription().then(() => {
  return testWithEnhancedData();
}).catch(console.error);