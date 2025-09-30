/**
 * Push-to-Talk utility for voice recording
 * Handles keyboard events and audio recording for push-to-talk functionality
 */

class PushToTalkManager {
  constructor(options = {}) {
    this.options = {
      onStartRecording: options.onStartRecording || (() => {}),
      onStopRecording: options.onStopRecording || (() => {}),
      onError: options.onError || (() => {}),
      serverUrl: options.serverUrl || "http://127.0.0.1:5000",
      ...options,
    };

    this.isActive = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  /**
   * Initialize push-to-talk functionality
   */
  init() {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    if (typeof window === "undefined") return;

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);



    this.stopRecording();
  }

  /**
   * Handle key down events
   */
  async handleKeyDown(e) {
    // Only respond to Ctrl key (Windows/Linux)
    const isCtrlKey =
      e.key === "Control" ||
      e.code === "ControlLeft" ||
      e.code === "ControlRight";

    if (!isCtrlKey || this.isActive) return;

    e.preventDefault();
    await this.startRecording();
  }

  /**
   * Handle key up events
   */
  async handleKeyUp(e) {
    // Only respond to Ctrl key (Windows/Linux)
    const isCtrlKey =
      e.key === "Control" ||
      e.code === "ControlLeft" ||
      e.code === "ControlRight";

    if (!isCtrlKey || !this.isActive) return;

    e.preventDefault();
    await this.stopRecording();
  }

  /**
   * Start audio recording
   */
  async startRecording() {
    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "audio/webm",
      });

      this.audioChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = async () => {
        await this.processRecording();
      };

      // Start recording
      this.mediaRecorder.start();
      this.isActive = true;

      // Notify callback
      this.options.onStartRecording();
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      this.options.onError(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop audio recording
   */
  async stopRecording() {
    if (!this.isActive || !this.mediaRecorder) return;

    try {
      this.mediaRecorder.stop();
      this.isActive = false;

      // Notify callback
      this.options.onStopRecording();
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
      this.options.onError(`Failed to stop recording: ${error.message}`);
    }
  }

  /**
   * Process the recorded audio and send to server
   */
  async processRecording() {
    try {
      if (this.audioChunks.length === 0) return;

      // Create blob from audio chunks
      const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });

      // Send to server for transcription
      await this.sendToServer(audioBlob);
    } catch (error) {
      console.error("❌ Failed to process recording:", error);
      this.options.onError(`Failed to process recording: ${error.message}`);
    } finally {
      // Cleanup
      this.cleanup();
    }
  }

  /**
   * Send audio blob to server for transcription via background worker
   */
  async sendToServer(audioBlob) {
    try {
      // Convert blob to base64 for sending through chrome messaging
      const base64Audio = await this.blobToBase64(audioBlob);

      // Send transcription request through window messaging (like App.jsx does)
      const requestId = `tx-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      window.postMessage(
        {
          type: "FROM_PAGE_TRANSCRIBE_AUDIO",
          message: {
            type: "transcribeAudio",
            requestId,
            audioData: base64Audio,
            language: "en",
            prompt:
              "This is math content for a lecture. If unclear, return empty string",
          },
        },
        "*"
      );
    } catch (error) {
      console.error("❌ Server transcription failed:", error);
      this.options.onError(`Server transcription failed: ${error.message}`);
    }
  }

  /**
   * Convert blob to base64 string
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1]; // Remove data:audio/webm;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Check if currently recording
   */
  isRecording() {
    return this.isActive;
  }
}

export default PushToTalkManager;
