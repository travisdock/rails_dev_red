class DialogManager {
  constructor(scene) {
    this.scene = scene;
    this.messages = [];
    this.currentIndex = 0;
    this.isActive = false;
    this.textBox = null;
    this.onComplete = null;
    this.charIndex = 0;
    this.fullText = '';
    this.displayText = '';
    this.typeTimer = null;
    this.isTyping = false;
    this.CHAR_DELAY = 30; // ms per character
  }

  show(messages, onComplete) {
    if (typeof messages === 'string') messages = [messages];
    this.messages = messages;
    this.currentIndex = 0;
    this.isActive = true;
    this.onComplete = onComplete || null;

    // Create text box
    const cam = this.scene.cameras.main;
    const boxHeight = 40;
    const boxY = GAME_HEIGHT - boxHeight - 2;

    this.bg = this.scene.add.rectangle(GAME_WIDTH / 2, boxY + boxHeight / 2, GAME_WIDTH - 8, boxHeight, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setScrollFactor(0)
      .setDepth(1000);

    this.text = this.scene.add.text(8, boxY + 4, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#333333',
      wordWrap: { width: GAME_WIDTH - 20 },
      lineSpacing: 2
    }).setScrollFactor(0).setDepth(1001);

    this.indicator = this.scene.add.text(GAME_WIDTH - 14, boxY + boxHeight - 10, '>', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#333333'
    }).setScrollFactor(0).setDepth(1001).setVisible(false);

    this.showMessage(this.messages[0]);
  }

  showMessage(msg) {
    this.fullText = msg;
    this.displayText = '';
    this.charIndex = 0;
    this.isTyping = true;
    this.indicator.setVisible(false);

    if (this.typeTimer) this.typeTimer.destroy();
    this.typeTimer = this.scene.time.addEvent({
      delay: this.CHAR_DELAY,
      callback: this.typeNextChar,
      callbackScope: this,
      loop: true
    });
  }

  typeNextChar() {
    if (this.charIndex < this.fullText.length) {
      this.displayText += this.fullText[this.charIndex];
      this.text.setText(this.displayText);
      this.charIndex++;
    } else {
      this.isTyping = false;
      if (this.typeTimer) this.typeTimer.destroy();
      this.indicator.setVisible(true);
    }
  }

  advance() {
    if (!this.isActive) return;

    // If still typing, show full text instantly
    if (this.isTyping) {
      if (this.typeTimer) this.typeTimer.destroy();
      this.isTyping = false;
      this.displayText = this.fullText;
      this.text.setText(this.displayText);
      this.indicator.setVisible(true);
      return;
    }

    // Next message
    this.currentIndex++;
    if (this.currentIndex < this.messages.length) {
      this.showMessage(this.messages[this.currentIndex]);
    } else {
      this.close();
    }
  }

  close() {
    this.isActive = false;
    if (this.typeTimer) this.typeTimer.destroy();
    if (this.bg) this.bg.destroy();
    if (this.text) this.text.destroy();
    if (this.indicator) this.indicator.destroy();
    if (this.onComplete) this.onComplete();
  }

  destroy() {
    if (this.typeTimer) this.typeTimer.destroy();
    if (this.bg) this.bg.destroy();
    if (this.text) this.text.destroy();
    if (this.indicator) this.indicator.destroy();
  }
}
