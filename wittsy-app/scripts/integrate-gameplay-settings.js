/**
 * Script to integrate gameplay settings into GameRoomScreen
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/screens/GameRoomScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update typing indicator to respect settings
content = content.replace(
  /if \(text\.length > 0 && gameState\?\.phase === 'submission' && user\?\.uid\) \{\s+setTyping\(roomId, user\.uid, true\);/g,
  `if (settings.gameplay.showTypingIndicators && text.length > 0 && gameState?.phase === 'submission' && user?.uid) {
      setTyping(roomId, user.uid, true);`
);

// 2. Add auto-submit logic when timer hits 0
const autoSubmitLogic = `
        // Auto-submit if enabled and time runs out
        if (remaining === 0 && !hasAdvanced && gameState.phase === 'submission') {
          if (settings.gameplay.autoSubmit && phrase.trim() && !hasSubmitted) {
            console.log('⚡ Auto-submitting phrase due to timeout');
            markSubmission(roomId, user.uid, phrase.trim());
            setHasSubmitted(true);
          }
        }
`;

content = content.replace(
  /(if \(remaining === 0 && !hasAdvanced\) \{\s+hasAdvanced = true;\s+advancePhase\(roomId\);)/,
  `$1${autoSubmitLogic}`
);

// 3. Add confirm before submit dialog
const confirmSubmitCode = `
  // Handle phrase submission with optional confirmation
  const handleSubmit = async () => {
    if (!user?.uid || !phrase.trim()) {
      Alert.alert('Error', 'Please enter a phrase');
      return;
    }

    const error = validatePhrase(phrase);
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    const submitPhrase = async () => {
      try {
        await markSubmission(roomId, user.uid, phrase.trim());
        
        setHasSubmitted(true);
        setTyping(roomId, user.uid, false);
      } catch (error) {
        console.error('Error submitting phrase:', error);
        Alert.alert('Error', 'Failed to submit phrase');
      }
    };

    // Show confirmation dialog if enabled
    if (settings.gameplay.confirmBeforeSubmit) {
      Alert.alert(
        'Confirm Submission',
        \`Submit this phrase?\\n\\n"\${phrase.trim()}"\`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: submitPhrase }
        ]
      );
    } else {
      await submitPhrase();
    }
  };
`;

content = content.replace(
  /\/\/ Handle phrase submission\s+const handleSubmit = async \(\) => \{[\s\S]*?\n  \};/,
  confirmSubmitCode
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Integrated gameplay settings into GameRoomScreen');
