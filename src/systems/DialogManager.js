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

  show(messages, onComplete, speakerName) {
    if (typeof messages === 'string') messages = [messages];
    this.messages = this.paginateMessages(messages);
    this.currentIndex = 0;
    this.isActive = true;
    this.onComplete = onComplete || null;

    // Create text box
    const cam = this.scene.cameras.main;
    const boxHeight = 48;
    const boxY = GAME_HEIGHT - boxHeight - 2;

    this.bg = this.scene.add.rectangle(GAME_WIDTH / 2, boxY + boxHeight / 2, GAME_WIDTH - 8, boxHeight, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setScrollFactor(0)
      .setDepth(1000);

    this.text = this.scene.add.text(8, boxY + 4, '', {
      ...TEXT_STYLE,
      wordWrap: { width: GAME_WIDTH - 20 },
      lineSpacing: 2
    }).setScrollFactor(0).setDepth(1001);

    this.indicator = this.scene.add.text(GAME_WIDTH - 14, boxY + boxHeight - 10, '>', {
      ...TEXT_STYLE
    }).setScrollFactor(0).setDepth(1001).setVisible(false);

    // Speaker name label above dialog box
    this.nameBg = null;
    this.nameText = null;
    if (speakerName) {
      const nameHeight = 14;
      const namePadding = 4;
      const nameTextObj = this.scene.add.text(8 + namePadding, boxY - nameHeight + 3, speakerName, {
        ...TEXT_STYLE
      }).setScrollFactor(0).setDepth(1001);
      const nameWidth = nameTextObj.width + namePadding * 2;
      this.nameBg = this.scene.add.rectangle(
        8 + nameWidth / 2, boxY - nameHeight / 2,
        nameWidth, nameHeight,
        0xffffff
      ).setStrokeStyle(2, 0x333333)
       .setScrollFactor(0)
       .setDepth(1000);
      this.nameText = nameTextObj;
    }

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

  // Split messages that are too long into multiple pages
  paginateMessages(messages) {
    const maxLines = 4;
    const maxCharsPerLine = 27; // approximate chars per line at 8px in 220px width
    const result = [];

    for (const msg of messages) {
      // Split message into visual lines (accounting for explicit \n and word wrap)
      const visualLines = [];
      const paragraphs = msg.split('\n');
      for (const para of paragraphs) {
        if (para.length <= maxCharsPerLine) {
          visualLines.push(para);
        } else {
          // Simulate word wrap
          const words = para.split(' ');
          let line = '';
          for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (test.length > maxCharsPerLine && line) {
              visualLines.push(line);
              line = word;
            } else {
              line = test;
            }
          }
          if (line) visualLines.push(line);
        }
      }

      // Split visual lines into pages of maxLines each
      if (visualLines.length <= maxLines) {
        result.push(msg);
      } else {
        for (let i = 0; i < visualLines.length; i += maxLines) {
          result.push(visualLines.slice(i, i + maxLines).join('\n'));
        }
      }
    }
    return result;
  }

  close() {
    this.isActive = false;
    if (this.typeTimer) this.typeTimer.destroy();
    if (this.bg) this.bg.destroy();
    if (this.text) this.text.destroy();
    if (this.indicator) this.indicator.destroy();
    if (this.nameBg) this.nameBg.destroy();
    if (this.nameText) this.nameText.destroy();
    if (this.onComplete) this.onComplete();
  }

  destroy() {
    if (this.typeTimer) this.typeTimer.destroy();
    if (this.bg) this.bg.destroy();
    if (this.text) this.text.destroy();
    if (this.indicator) this.indicator.destroy();
    if (this.nameBg) this.nameBg.destroy();
    if (this.nameText) this.nameText.destroy();
  }
}
