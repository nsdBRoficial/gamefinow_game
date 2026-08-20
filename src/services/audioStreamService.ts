/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioStreamService {
  private audioCtx: AudioContext | null = null;
  private isPlayingAmphitheaterBgm = false;
  private bgmGainNode: GainNode | null = null;
  private synthInterval: any = null;

  public init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  /**
   * Inicia a trilha musical mística e orquestrada do Anfiteatro em tempo real
   */
  public startAmphitheaterBgm() {
    if (this.isPlayingAmphitheaterBgm) return;
    this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    this.isPlayingAmphitheaterBgm = true;

    // Gerador de melodia orquestrada mística e harmoniosa para a arena
    const notes = [220, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // Escala de Lá Menor Pentatônica
    let step = 0;

    this.synthInterval = setInterval(() => {
      if (!this.isPlayingAmphitheaterBgm || !this.audioCtx) return;

      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        const freq = notes[step % notes.length];
        osc.type = step % 3 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.2);

        step = (step + 1) % notes.length;
      } catch (e) {
        console.warn("Erro ao sintetizar nota do anfiteatro:", e);
      }
    }, 600);
  }

  /**
   * Encerra a trilha musical do Anfiteatro
   */
  public stopAmphitheaterBgm() {
    this.isPlayingAmphitheaterBgm = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  /**
   * Efeito sonoro de aplauso e aclamação da plateia no anfiteatro
   */
  public playApplause() {
    this.init();
    if (!this.audioCtx) return;
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300 + Math.random() * 400, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
      }, i * 40);
    }
  }
}

export const audioStreamService = new AudioStreamService();
