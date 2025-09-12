// Generate a sample Kinko-ryu score image using our renderer
const fs = require('fs');

// Create a demo score that shows the notation system capabilities
const demoScore = {
  title: "Kinko-ryu Notation Demo",
  phrases: [
    {
      notes: [
        { katakana: "ロ", fingering: "ro", pitch: 293.66, duration: 2.0, ornaments: ["—"], techniques: ["meri"] },
        { katakana: "ツ", fingering: "tsu", pitch: 349.23, duration: 1.0, ornaments: [], techniques: [] },
        { katakana: "レ", fingering: "re", pitch: 392.00, duration: 1.5, ornaments: ["＞"], techniques: ["kari"] },
      ],
      breath: true,
      expression: "Slow, meditative"
    },
    {
      notes: [
        { katakana: "チ", fingering: "chi", pitch: 440.00, duration: 1.0, ornaments: ["⌒"], techniques: ["ornamental"] },
        { katakana: "リ", fingering: "ri", pitch: 523.25, duration: 1.5, ornaments: ["—"], techniques: [] },
        { katakana: "レ◯", fingering: "re-meri", pitch: 415.30, duration: 0.8, ornaments: [], techniques: ["meri"] },
      ],
      breath: true,
      expression: "Flowing"
    },
    {
      notes: [
        { katakana: "口", fingering: "kan-ro", pitch: 587.33, duration: 2.0, ornaments: ["—", "＜"], techniques: [] },
        { katakana: "乙", fingering: "kan-tsu", pitch: 698.46, duration: 1.5, ornaments: ["⌒"], techniques: ["ornamental"] },
        { katakana: "工", fingering: "kan-re", pitch: 783.99, duration: 1.0, ornaments: ["＞"], techniques: [] },
      ],
      breath: true,
      expression: "High register, powerful"
    }
  ],
  tempo: 85,
  key: "D",
  metadata: {
    composer: "Traditional Style",
    arranger: "AI Transcription Demo", 
    date: "2025"
  }
};

console.log('🎼 DEMO KINKO-RYU SCORE VISUALIZATION');
console.log('=====================================\n');

console.log(`Title: ${demoScore.title}`);
console.log(`Tempo: ♩ = ${demoScore.tempo}`);
console.log(`Key: ${demoScore.key} (Traditional shakuhachi tuning)`);
console.log(`Style: ${demoScore.metadata.composer}\n`);

// Render in traditional format
demoScore.phrases.forEach((phrase, phraseIndex) => {
  console.log(`Phrase ${phraseIndex + 1}: ${phrase.expression || ''}`);
  console.log('─'.repeat(60));
  
  // Traditional right-to-left layout with ornaments
  const noteDisplay = phrase.notes.map(note => {
    let display = '';
    
    // Ornaments above (using spacing for alignment)
    if (note.ornaments && note.ornaments.length > 0) {
      display += note.ornaments.join('') + '\n';
    } else {
      display += ' \n'; // Empty line for alignment
    }
    
    // Main katakana character
    display += note.katakana + '\n';
    
    // Techniques below
    if (note.techniques && note.techniques.length > 0) {
      display += '(' + note.techniques.join(',') + ')';
    } else {
      display += ' '; // Empty space for alignment
    }
    
    // Duration marks
    if (note.duration >= 1.5) {
      display += '\n' + '—'.repeat(Math.floor(note.duration));
    }
    
    return display;
  }).reverse(); // Right to left reading
  
  // Display with proper spacing
  const maxLines = Math.max(...noteDisplay.map(note => note.split('\n').length));
  
  for (let line = 0; line < maxLines; line++) {
    const lineText = noteDisplay.map(note => {
      const lines = note.split('\n');
      return (lines[line] || '').padEnd(8);
    }).join('');
    console.log(lineText);
  }
  
  if (phrase.breath) {
    console.log('\n' + ' '.repeat(40) + '、(息継ぎ / breath)\n');
  }
});

// Show fingering reference
console.log('\n🎯 FINGERING REFERENCE');
console.log('======================');
console.log('● = closed hole, ○ = open hole\n');

const fingerings = [
  { note: 'ロ (ro)', pattern: '●●●●●', desc: 'All holes closed' },
  { note: 'ツ (tsu)', pattern: '○●●●●', desc: 'First hole open' },
  { note: 'レ (re)', pattern: '○○●●●', desc: 'First two holes open' },
  { note: 'チ (chi)', pattern: '○○○●●', desc: 'First three holes open' },
  { note: 'リ (ri)', pattern: '○○○○●', desc: 'First four holes open' },
  { note: '口 (kan-ro)', pattern: '●●●●● (kan)', desc: 'Overblown ro' },
];

fingerings.forEach(f => {
  console.log(`${f.note.padEnd(12)} ${f.pattern.padEnd(12)} ${f.desc}`);
});

console.log('\n📝 NOTATION SYMBOLS');
console.log('===================');
console.log('—  Long tone (nobashi)');
console.log('⌒  Vibrato (yuri)'); 
console.log('＞  Accent (strong attack)');
console.log('＜  Crescendo');
console.log('○  Meri (half-hole, pitch lowered)');
console.log('、 Breath mark (iki)');

console.log('\n🎵 This demonstrates traditional Kinko-ryu shakuhachi notation');
console.log('   as it would appear in a formal transcription score.');

// Generate simple text-based score file
const scoreText = `KINKO-RYU NOTATION DEMO
========================

Phrase 1: Slow, meditative
                —
                ロ      ツ      ＞
               (meri)          レ
               ——              (kari)
                               ─

                        、(breath)

Phrase 2: Flowing  
    ⌒        —
    チ        リ      レ◯
  (orn.)            (meri)

                        、(breath)

Phrase 3: High register, powerful
    —＜       ⌒        ＞
    口        乙        工
   (kan)    (orn.)   (kan)
   ——       —

                        、(breath)

Generated by AI Kinko-ryu Transcription System
Traditional Japanese shakuhachi notation preserved digitally
`;

fs.writeFileSync('kinko-score-demo.txt', scoreText);
console.log('\n📄 Score saved to: kinko-score-demo.txt');

console.log('\n✨ To generate PNG image, this would integrate with:');
console.log('   - Canvas-based score renderer (KinkoScoreRenderer)');  
console.log('   - Japanese font support for authentic katakana');
console.log('   - Traditional right-to-left layout engine');
console.log('   - PDF export with high-resolution output');